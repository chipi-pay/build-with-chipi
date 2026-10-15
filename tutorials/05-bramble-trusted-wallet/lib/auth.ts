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
 * - Sign in with Starknet proves the user holds the Bramble account
 *   (app/api/auth/verify). The user id is that address.
 * - A signed, httpOnly cookie remembers it. Nonces live in memory.
 * - Chipi's API needs a JWT it can check against a JWKS you register in the
 *   Chipi dashboard: RS256, one key, `sub` = the user id. /api/auth/token
 *   issues it and /api/auth/jwks publishes the key.
 *
 * In production use a real auth library (sessions in a database, key
 * rotation, sign-out everywhere). Vela does this with Better Auth plus a
 * Sign in with Starknet plugin:
 * https://github.com/chipi-pay/vela/blob/main/lib/auth-starknet.ts
 */

/** Where the app runs. The SIWS message names it, and Chipi checks tokens against `${appUrl()}/api/auth/jwks`. */
export function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL must be set (the https URL this app is served from)");
  return url.replace(/\/$/, "");
}

/** Separate keys for separate jobs, derived from one APP_SECRET. */
function derivedKey(purpose: string): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) throw new Error("APP_SECRET must be set (at least 32 characters)");
  return Buffer.from(hkdfSync("sha256", secret, "", `bramble-tutorial:${purpose}`, 32));
}

/** Encrypts the agent's session key at rest (step 6). Never sent to the browser. */
export function agentSessionSecret(): string {
  return derivedKey("agent-session").toString("hex");
}

// ── Sign-in nonces ────────────────────────────────────────────────────────

export interface IssuedNonce {
  address: string;
  issuedAt: number;
  expirationTime: number;
}

const NONCE_TTL_SECONDS = 600;
const memory = globalThis as unknown as { __siwsNonces?: Map<string, IssuedNonce> };
const nonces = (memory.__siwsNonces ??= new Map<string, IssuedNonce>());

export function issueNonce(address: string): { nonce: string; issued: IssuedNonce } {
  const now = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString("hex");
  const issued = { address, issuedAt: now, expirationTime: now + NONCE_TTL_SECONDS };
  nonces.set(nonce, issued);
  return { nonce, issued };
}

/** Each nonce works once: it is deleted before the signature is checked. */
export function consumeNonce(nonce: string): IssuedNonce | null {
  const issued = nonces.get(nonce);
  nonces.delete(nonce);
  if (!issued || issued.expirationTime <= Math.floor(Date.now() / 1000)) return null;
  return issued;
}

// ── Session cookie ────────────────────────────────────────────────────────

const COOKIE = "bramble_session";
const SESSION_SECONDS = 24 * 60 * 60;

function mac(value: string): string {
  return createHmac("sha256", derivedKey("cookie")).update(value).digest("base64url");
}

export async function startSession(address: string): Promise<void> {
  const body = Buffer.from(JSON.stringify({ sub: address, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${mac(body)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in Bramble address (0x + 64 hex), or null. */
export async function currentAddress(): Promise<string | null> {
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

/** A 15-minute RS256 token whose `sub` is the Bramble address: Chipi's `externalUserId`. */
export function chipiToken(address: string): string {
  const { privateKey, kid } = jwtKey();
  const now = Math.floor(Date.now() / 1000);
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT", kid })}.${encode({
    sub: address,
    iss: appUrl(),
    aud: appUrl(),
    iat: now,
    exp: now + 15 * 60,
  })}`;
  return `${unsigned}.${sign("sha256", Buffer.from(unsigned), privateKey).toString("base64url")}`;
}
