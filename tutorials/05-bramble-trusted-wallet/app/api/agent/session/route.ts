import { NextResponse } from "next/server";
import { waitForTransaction } from "@chipi-stack/backend";
import { agentSessionSecret, currentAddress } from "@/lib/auth";
import { chipi } from "@/lib/chipi";
import { getAgent, saveAgent } from "@/lib/agent-store";
import { SESSION_SECONDS } from "@/lib/config";

/** GET: the agent's session as the wallet contract sees it. */
export async function GET() {
  const userId = await currentAddress();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = getAgent(userId);
  if (!agent) return NextResponse.json({ hired: false });
  const wallet = await chipi().getWallet({ externalUserId: userId });
  if (!wallet) return NextResponse.json({ hired: false });

  const onChain = await chipi().sessions.getSessionData({
    walletAddress: wallet.publicKey,
    sessionPublicKey: agent.session.publicKey,
  });
  return NextResponse.json({
    hired: agent.active,
    sessionPublicKey: agent.session.publicKey,
    validUntil: agent.session.validUntil,
    onChain,
  });
}

/**
 * POST: create the agent's session keypair. Nothing happens on-chain: Bramble
 * registers the public key; the encrypted private key stays here.
 */
export async function POST() {
  const userId = await currentAddress();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = chipi().sessions.createSessionKey({
    encryptKey: agentSessionSecret(),
    durationSeconds: SESSION_SECONDS,
  });
  saveAgent(userId, { session, active: false });
  return NextResponse.json({ sessionPublicKey: session.publicKey, validUntil: session.validUntil });
}

/**
 * PATCH { active, txHash }: Bramble registered (or revoked) the session.
 * Trust the chain, not the client.
 */
export async function PATCH(req: Request) {
  const userId = await currentAddress();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const agent = getAgent(userId);
  if (!agent) return NextResponse.json({ error: "no agent session" }, { status: 404 });

  const { active, txHash } = (await req.json()) as { active?: unknown; txHash?: unknown };
  if (typeof active !== "boolean" || typeof txHash !== "string") {
    return NextResponse.json({ error: "active (boolean) and txHash are required" }, { status: 400 });
  }

  // A hash is not a result.
  const receipt = await waitForTransaction(txHash);
  if (!receipt.success) {
    return NextResponse.json({ error: `transaction reverted: ${receipt.revertReason ?? "unknown"}` }, { status: 409 });
  }

  const wallet = await chipi().getWallet({ externalUserId: userId });
  if (!wallet) return NextResponse.json({ error: "no wallet" }, { status: 404 });
  const onChain = await chipi().sessions.getSessionData({
    walletAddress: wallet.publicKey,
    sessionPublicKey: agent.session.publicKey,
  });
  // A relayed call the wallet refused can still come back SUCCEEDED: read the state.
  if (onChain.isActive !== active) {
    return NextResponse.json({ error: `the session is ${onChain.isActive ? "still active" : "not active"} on-chain` }, { status: 409 });
  }

  saveAgent(userId, { ...agent, active });
  return NextResponse.json({ hired: active, onChain });
}
