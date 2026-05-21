import "server-only";

import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { findUserByEmail, createUser, upsertOAuthUser } from "@/lib/server/localUserStore";

const QF_TIMEOUT_MS = 6000;

function normalizeUser(record) {
  return {
    id: record.id,
    email: record.email,
    name: record.name || "",
    provider: record.provider || "local",
  };
}

async function qfFetch(path, body) {
  const authBaseUrl = process.env.QF_USER_API_BASE_URL?.trim();
  const clientId = process.env.QF_CLIENT_ID?.trim();
  if (!authBaseUrl || !clientId) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QF_TIMEOUT_MS);

  try {
    const response = await fetch(`${authBaseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message:
          data?.message || data?.error_description || data?.error || text || "Quran Foundation API request failed.",
      };
    }
    return { ok: true, data, status: response.status };
  } catch {
    return { ok: false, status: 503, message: "Unable to connect. Please try again later." };
  } finally {
    clearTimeout(timer);
  }
}

async function qfSignUp({ name, email, password }) {
  const remote = await qfFetch("/auth/v1/signup", { name, email, password });
  if (!remote?.ok) return { error: remote };
  const payload = remote.data || {};
  if (!payload?.user?.id) {
    return { error: { status: 502, message: "Unexpected response from Quran Foundation API." } };
  }
  return {
    id: payload.user.id,
    email: payload.user.email || email,
    name: payload.user.name || name || "",
    provider: "quran-foundation",
    accessToken: payload.access_token || payload.token || null,
  };
}

async function qfSignIn({ email, password }) {
  const remote = await qfFetch("/auth/v1/login", { email, password });
  if (!remote?.ok) return { error: remote };
  const payload = remote.data || {};
  if (!payload?.user?.id) {
    return { error: { status: 502, message: "Unexpected response from Quran Foundation API." } };
  }
  return {
    id: payload.user.id,
    email: payload.user.email || email,
    name: payload.user.name || "",
    provider: "quran-foundation",
    accessToken: payload.access_token || payload.token || null,
  };
}

function mapApiErrorMessage(raw, fallback) {
  const msg = String(raw || "").toLowerCase();
  if (msg.includes("already") || msg.includes("exists")) return "Account already exists, please sign in";
  if (msg.includes("invalid credentials") || msg.includes("password")) return "Incorrect email or password";
  if (msg.includes("not found") || msg.includes("no user")) return "No account found with this email";
  if (msg.includes("unable to connect")) return "Unable to connect. Please try again later";
  if (process.env.NODE_ENV !== "production" && raw) return String(raw);
  return fallback;
}

export async function signUpWithFallback({ name, email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return { error: "Account already exists, please sign in", status: 409, code: "EMAIL_EXISTS" };
  }

  const remoteUser = await qfSignUp({ name, email: normalizedEmail, password });
  if (remoteUser?.error) {
    if (remoteUser.error.status < 500 && remoteUser.error.status !== 404) {
      return {
        error: mapApiErrorMessage(remoteUser.error.message, "Unable to create account."),
        status: remoteUser.error.status || 400,
        code: "QF_SIGNUP_FAILED",
      };
    }
  } else if (remoteUser) {
    return { user: normalizeUser(remoteUser), usedFallback: false, qfAccessToken: remoteUser.accessToken || null };
  }

  const user = await createUser({
    id: `local_${randomUUID()}`,
    email: normalizedEmail,
    name: String(name || "").trim(),
    passwordHash: hashPassword(password),
    provider: "local",
    createdAt: new Date().toISOString(),
  });

  return { user: normalizeUser(user), usedFallback: true, warning: "Quran Foundation unavailable; fallback used." };
}

export async function signInWithFallback({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const remoteUser = await qfSignIn({ email: normalizedEmail, password });
  if (remoteUser?.error) {
    if (remoteUser.error.status === 401 || remoteUser.error.status === 403) {
      return { error: "Incorrect email or password", status: 401, code: "INVALID_CREDENTIALS" };
    }
    if (remoteUser.error.status === 404) {
      return { error: "No account found with this email", status: 404, code: "USER_NOT_FOUND" };
    }
    if (remoteUser.error.status < 500) {
      return {
        error: mapApiErrorMessage(remoteUser.error.message, "Unable to sign in."),
        status: remoteUser.error.status,
        code: "QF_SIGNIN_FAILED",
      };
    }
  } else if (remoteUser) {
    return { user: normalizeUser(remoteUser), usedFallback: false, qfAccessToken: remoteUser.accessToken || null };
  }

  const localUser = await findUserByEmail(normalizedEmail);
  if (!localUser) {
    return { error: "No account found with this email", status: 404, code: "USER_NOT_FOUND" };
  }
  if (!localUser.passwordHash) {
    return { error: "Use Google Sign-In for this account", status: 400, code: "PASSWORD_NOT_SET" };
  }
  if (!verifyPassword(password, localUser.passwordHash)) {
    return { error: "Incorrect email or password", status: 401, code: "INVALID_CREDENTIALS" };
  }

  return { user: normalizeUser(localUser), usedFallback: true };
}

export async function signInWithGoogle({ email, name, googleSub }) {
  const remoteUser = await qfFetch("/auth/v1/google-login", { email, name, googleSub });
  if (remoteUser?.ok && remoteUser?.data?.user?.id) {
    return {
      user: normalizeUser({
        id: remoteUser.data.user.id,
        email: remoteUser.data.user.email || email,
        name: remoteUser.data.user.name || name || "",
        provider: "quran-foundation",
      }),
      usedFallback: false,
    };
  }

  const local = await upsertOAuthUser({ email, name, provider: "google", providerId: googleSub });
  return { user: normalizeUser(local), usedFallback: true };
}
