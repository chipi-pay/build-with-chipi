import "server-only";
import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  hkdfSync,
  randomBytes,
  sign,
  timingSafeEqual,
  type KeyObject,
} from "node:crypto";
import { cookies } from "next/headers";

/**
 * The smallest auth that works with Chipi, for this tutorial only:
 *
 * - An anonymous account: a random user id in a signed, httpOnly cookie
 *   (POST /api/auth/anonymous). No email, no password; the passkey created in
 *   step 2 is what really identifies the user.
 * - Chipi's API needs a JWT it can check against a JWKS you register in the
 *   Chipi dashboard: RS256, one key, `sub` = the user id. /api/auth/token
 *   issues it and /api/auth/jwks publishes the key.
 *
 * In production use a real auth library, so the account outlives this
 * browser's cookie: Vela does it with Better Auth's anonymous plugin plus
 * passkey sign-in, so the same passkey opens the account on a new device:
 * https://github.com/chipi-pay/vela/blob/main/lib/auth.ts
 */

/** Where the app runs. Chipi checks tokens against `${appUrl()}/api/auth/jwks`. */
export function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL must be set (the https URL this app is served from)");
  return url.replace(/\/$/, "");
}

function cookieKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) throw new Error("APP_SECRET must be set (at least 32 characters)");
  return Buffer.from(hkdfSync("sha256", secret, "", "fund-from-base-tutorial:cookie", 32));
}

// ── Session cookie ────────────────────────────────────────────────────────

const COOKIE = "tutorial_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;

function mac(value: string): string {
  return createHmac("sha256", cookieKey()).update(value).digest("base64url");
}

/** A new anonymous user id, remembered in the cookie. Returns it. */
export async function startAnonymousSession(): Promise<string> {
  const userId = `user_${randomBytes(12).toString("hex")}`;
  const body = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${mac(body)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return userId;
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user id, or null. */
export async function currentUserId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const { sub, exp } = JSON.parse(Buffer.from(body, "base64url").toString()) as { sub: string; exp: number };
  return exp > Math.floor(Date.now() / 1000) ? sub : null;
}

// ── JWT for Chipi ─────────────────────────────────────────────────────────

let signingKey: { privateKey: KeyObject; kid: string; publicJwk: Record<string, unknown> } | undefined;

/** APP_JWT_PRIVATE_KEY: a base64-encoded PKCS#8 PEM RSA key (see env.example). */
function jwtKey() {
  if (signingKey) return signingKey;
  const encoded = process.env.APP_JWT_PRIVATE_KEY;
  if (!encoded) throw new Error("APP_JWT_PRIVATE_KEY must be set (see env.example)");
  const privateKey = createPrivateKey(Buffer.from(encoded, "base64").toString("utf8"));
  const { n, e } = createPublicKey(privateKey).export({ format: "jwk" }) as { n: string; e: string };
  // RFC 7638 thumbprint: a stable key id.
  const kid = createHash("sha256").update(JSON.stringify({ e, kty: "RSA", n })).digest("base64url");
  signingKey = { privateKey, kid, publicJwk: { kty: "RSA", n, e, kid, alg: "RS256", use: "sig" } };
  return signingKey;
}

/** One key, no rotation: what Chipi's validator expects. */
export function jwks(): { keys: Array<Record<string, unknown>> } {
  return { keys: [jwtKey().publicJwk] };
}

/** A 15-minute RS256 token whose `sub` is the user id: Chipi's `externalUserId`. */
export function chipiToken(userId: string): string {
  const { privateKey, kid } = jwtKey();
  const now = Math.floor(Date.now() / 1000);
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT", kid })}.${encode({
    sub: userId,
    iss: appUrl(),
    aud: appUrl(),
    iat: now,
    exp: now + 15 * 60,
  })}`;
  return `${unsigned}.${sign("sha256", Buffer.from(unsigned), privateKey).toString("base64url")}`;
}
