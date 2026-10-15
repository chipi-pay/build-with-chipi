import { NextResponse } from "next/server";
import {
  createStarknetSignInTypedData,
  verifyStarknetSignIn,
  type StarknetDeploymentData,
} from "@chipi-stack/backend";
import { appUrl, consumeNonce, startSession } from "@/lib/auth";
import { provider } from "@/lib/starknet";

/**
 * POST { nonce, signature, deploymentData? }: checks the signature, then
 * signs the user in as that Bramble address.
 */
export async function POST(req: Request) {
  const { nonce, signature, deploymentData } = (await req.json()) as {
    nonce?: unknown;
    signature?: unknown;
    deploymentData?: StarknetDeploymentData;
  };
  if (typeof nonce !== "string" || !Array.isArray(signature) || signature.some((felt) => typeof felt !== "string")) {
    return NextResponse.json({ error: "nonce and signature are required" }, { status: 400 });
  }

  // Once, whatever happens next: a replayed signature finds no nonce.
  const issued = consumeNonce(nonce);
  if (!issued) return NextResponse.json({ error: "The sign-in request expired. Try again." }, { status: 401 });

  const domain = new URL(appUrl()).host;
  const result = await verifyStarknetSignIn({
    // Rebuilt from what this server issued, never taken from the client.
    typedData: createStarknetSignInTypedData({ domain, uri: appUrl(), nonce, ...issued }),
    signature: signature as string[],
    provider,
    expected: { domain, uri: appUrl(), nonce },
    deploymentData,
  });
  if (!result.ok) {
    // ACCOUNT_NOT_DEPLOYED: send deploymentData. WRONG_CHAIN: Bramble is not on mainnet.
    return NextResponse.json({ error: `Sign-in refused: ${result.reason}`, reason: result.reason }, { status: 401 });
  }

  await startSession(result.address);
  return NextResponse.json({ address: result.address });
}
