import "server-only";
import { ChipiServerSDK } from "@chipi-stack/backend";

// Server-only: the secret key never reaches the browser.
export const chipi = new ChipiServerSDK({
  apiPublicKey: process.env.NEXT_PUBLIC_CHIPI_API_KEY!,
  apiSecretKey: process.env.CHIPI_API_SECRET_KEY!,
});

export function agentSessionSecret(): string {
  const secret = process.env.AGENT_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AGENT_SESSION_SECRET must be set (at least 32 characters)");
  }
  return secret;
}
