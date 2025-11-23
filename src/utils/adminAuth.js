// Runtime-safe admin token helper. Avoids static Node `crypto` import so it can
// be loaded in Edge runtime (middleware) while still using Node crypto when
// available. Exports async `signAdminToken` and `verifyAdminToken`.

const SECRET =
  process.env.ADMIN_COOKIE_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.NEXT_AUTH_SECRET ||
  "default_local_secret";

const TTL_MS =
  (process.env.ADMIN_SESSION_TTL_SECONDS
    ? Number(process.env.ADMIN_SESSION_TTL_SECONDS)
    : 60 * 30) * 1000;

function isNode() {
  return !!(
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.node
  );
}

function utf8ToUint8(str) {
  return new TextEncoder().encode(str);
}

function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret, message) {
  if (isNode()) {
    const crypto = await import("crypto");
    return crypto.createHmac("sha256", secret).update(message).digest("hex");
  }
  // Web Crypto
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
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function base64Encode(str) {
  if (isNode()) return Buffer.from(str, "utf8").toString("base64");
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(b64) {
  if (isNode()) return Buffer.from(b64, "base64").toString("utf8");
  return decodeURIComponent(escape(atob(b64)));
}

export async function signAdminToken(email) {
  const ts = Date.now();
  const data = `${email}:${ts}`;
  const h = await hmacHex(SECRET, data);
  return base64Encode(`${email}:${ts}:${h}`);
}

export async function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const raw = base64Decode(token);
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
    const parts = raw.split(":");
    return parts[0] || null;
  } catch (e) {
    return null;
  }
}
