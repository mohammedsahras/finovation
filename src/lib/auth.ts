// ============================================================
// Finovation Auth - zero-dependency JWT-style tokens + scrypt
// password hashing using Node's built-in crypto module.
// Server-only. Do NOT import from client components.
// ============================================================
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "finovation-secret-9f2b7c1a-2026";
const TOKEN_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const check = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return expected.length === check.length && crypto.timingSafeEqual(expected, check);
  } catch {
    return false;
  }
}

/** HMAC-signed token: base64url(payload).base64url(hmac) */
export function createToken(userId: string): string {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS });
  const data = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): string | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload.uid as string;
  } catch {
    return null;
  }
}

/** Extract user id from the Authorization: Bearer header. */
export function getAuthUserId(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7).trim());
}
