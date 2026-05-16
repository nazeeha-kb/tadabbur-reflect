import { createHmac, timingSafeEqual } from "node:crypto";

const ALGO = "HS256";

function getJwtSecret() {
  const secret =
    process.env.APP_JWT_SECRET?.trim() ||
    process.env.QF_OAUTH_COOKIE_SECRET?.trim() ||
    process.env.QF_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error("Set APP_JWT_SECRET (or QF_OAUTH_COOKIE_SECRET / QF_CLIENT_SECRET) for app authentication.");
  }
  return secret;
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function signRaw(data) {
  return createHmac("sha256", getJwtSecret()).update(data).digest("base64url");
}

export function signJwt(payload, expiresInSec = 60 * 60 * 24 * 30) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: ALGO, typ: "JWT" };
  const body = { ...payload, iat: nowSec, exp: nowSec + expiresInSec };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = signRaw(data);
  return `${data}.${signature}`;
}

export function verifyJwt(token) {
  const [encodedHeader, encodedBody, signature] = String(token || "").split(".");
  if (!encodedHeader || !encodedBody || !signature) return null;
  const data = `${encodedHeader}.${encodedBody}`;
  const expected = signRaw(data);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number") return null;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
