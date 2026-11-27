/** Edge-compatible HMAC-SHA256 session helpers for SmartRetail Judge Portal. */

export const SESSION_COOKIE_NAME = "smartretail_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function getDemoCredentials(): { email: string; password: string } {
  return {
    email: process.env.DEMO_USER_EMAIL || "judge@smartretail.th",
    password: process.env.DEMO_USER_PASSWORD || "SmartRetail2025",
  };
}

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "smartretail-thailand-2025-executive-portal-secret"
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signPayload(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
}

export async function createSessionToken(email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${email}|${exp}`;
  const sig = await signPayload(payload);
  return `${payload}|${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<{ valid: boolean; email?: string }> {
  if (!token) return { valid: false };
  const parts = token.split("|");
  if (parts.length !== 3) return { valid: false };
  const [email, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return { valid: false };
  }
  const expectedSig = await signPayload(`${email}|${expStr}`);
  if (sig.length !== expectedSig.length) return { valid: false };
  let diff = 0;
  for (let i = 0; i < sig.length; i += 1) {
    diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0 ? { valid: true, email } : { valid: false };
}
