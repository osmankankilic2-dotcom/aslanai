import crypto from "node:crypto";

const SESSION_COOKIE = "aslan_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  return process.env.ASLAN_SESSION_SECRET || process.env.DATABASE_URL || "aslan-development-session-secret";
}

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
}

export function passwordDigest(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${hashPassword(password, salt)}`;
}

export function verifyPassword(password: string, digest: string) {
  const [salt, expected] = digest.split(":");
  if (!salt || !expected) return false;
  const actual = hashPassword(password, salt);
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSession(userId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function readSession(cookieHeader: string | undefined) {
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return undefined;
  const [userIdText, expiresText, signature] = token.split(".");
  const userId = Number(userIdText);
  const expiresAt = Number(expiresText);
  if (!Number.isInteger(userId) || !Number.isFinite(expiresAt) || !signature || expiresAt < Date.now() / 1000) return undefined;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(`${userId}.${expiresAt}`).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return undefined;
  return { userId, expiresAt };
}

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=None; Secure`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=None; Secure`;
}

export function generateApiKey() {
  return `aslan_${crypto.randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}
