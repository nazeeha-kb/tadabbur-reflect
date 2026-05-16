import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const STREAKS_FILE = path.join(DATA_DIR, "streaks.json");

async function ensureFile(filePath, fallback) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
}

async function readJson(filePath, fallback) {
  await ensureFile(filePath, fallback);
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureFile(filePath, value);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function getUsers() {
  return readJson(USERS_FILE, []);
}

export async function findUserByEmail(email) {
  const users = await getUsers();
  const normalized = String(email || "").trim().toLowerCase();
  return users.find((item) => item.email.toLowerCase() === normalized) || null;
}

export async function findUserById(userId) {
  const users = await getUsers();
  return users.find((item) => item.id === userId) || null;
}

export async function createUser(user) {
  const users = await getUsers();
  users.push(user);
  await writeJson(USERS_FILE, users);
  return user;
}

export async function upsertOAuthUser({ email, name, provider, providerId }) {
  const users = await getUsers();
  const normalized = String(email || "").trim().toLowerCase();
  const existing = users.find((item) => item.email.toLowerCase() === normalized);
  if (existing) {
    existing.name = name || existing.name || "";
    existing.provider = provider || existing.provider || "local";
    existing.providerId = providerId || existing.providerId;
    await writeJson(USERS_FILE, users);
    return existing;
  }

  const created = {
    id: `local_${provider || "oauth"}_${providerId || Date.now()}`,
    email: normalized,
    name: name || "",
    provider: provider || "google",
    providerId: providerId || null,
    createdAt: new Date().toISOString(),
  };
  users.push(created);
  await writeJson(USERS_FILE, users);
  return created;
}

export async function getStreakMap() {
  return readJson(STREAKS_FILE, {});
}

export async function getStreakForUser(userId) {
  const map = await getStreakMap();
  return map[userId] || null;
}

export async function saveStreakForUser(userId, streak) {
  const map = await getStreakMap();
  map[userId] = streak;
  await writeJson(STREAKS_FILE, map);
  return streak;
}

export async function updateUserProfile(userId, { name, avatarUrl }) {
  const users = await getUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return null;

  if (typeof name === "string") {
    user.name = name.trim().slice(0, 80);
  }
  if (avatarUrl === null) {
    delete user.avatarUrl;
  } else if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
    user.avatarUrl = avatarUrl;
  }

  await writeJson(USERS_FILE, users);
  return user;
}
