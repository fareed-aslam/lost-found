// Edge-compatible admin token verifier using Web Crypto only.
// Provides `verifyAdminToken(token)` and `extractEmailFromToken(token)`.

const SECRET =
  process.env.ADMIN_COOKIE_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.NEXT_AUTH_SECRET ||
  "default_local_secret";

const TTL_MS =
  (process.env.ADMIN_SESSION_TTL_SECONDS
    ? Number(process.env.ADMIN_SESSION_TTL_SECONDS)
    : 60 * 30) * 1000;

function utf8ToUint8(str) {
  return new TextEncoder().encode(str);
}

function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8ToUint8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8ToUint8(message));
  return bufToHex(sig);
}

function constantTimeEq(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++)
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function base64Decode(b64) {
  // atob yields a binary string; decode to UTF-8 safely
  try {
    const bin = atob(b64);
    try {
      return decodeURIComponent(escape(bin));
    } catch (e) {
      return bin;
    }
  } catch (e) {
    return null;
  }
}

export async function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const raw = base64Decode(token);
    if (!raw) return false;
    const parts = raw.split(":");
    if (parts.length < 3) return false;
    const email = parts[0];
    const ts = Number(parts[1]);
    const sig = parts.slice(2).join(":");
    if (!email || !sig || Number.isNaN(ts)) return false;
    const expected = await hmacHex(SECRET, `${email}:${ts}`);
    if (!constantTimeEq(expected, sig)) return false;
    if (Date.now() - ts > TTL_MS) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export function extractEmailFromToken(token) {
  try {
    const raw = base64Decode(token);
    if (!raw) return null;
    const parts = raw.split(":");
    return parts[0] || null;
  } catch (e) {
    return null;
  }
}
