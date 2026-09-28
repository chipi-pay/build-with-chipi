import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { waitForTransaction } from "@chipi-stack/backend";
import { agentSessionSecret, chipi } from "@/lib/chipi";
import { getAgent, saveAgent } from "@/lib/agent-store";
import { SESSION_SECONDS } from "@/lib/limits";

/**
 * POST: create the agent's session keypair on the server.
 *
 * Nothing happens on-chain here. The browser registers the public key with the
 * user's passkey; the encrypted private key stays on the server.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = chipi.sessions.createSessionKey({
    encryptKey: agentSessionSecret(),
    durationSeconds: SESSION_SECONDS,
  });
  saveAgent(userId, { session, active: false, decisions: [] });

  return NextResponse.json({ sessionPublicKey: session.publicKey, validUntil: session.validUntil });
}

/**
 * PATCH { active, txHash }: record that the browser registered or revoked the
 * session, once its transaction is on-chain.
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = getAgent(userId);
  if (!agent) return NextResponse.json({ error: "no agent" }, { status: 404 });

  const { active, txHash } = (await req.json()) as { active?: unknown; txHash?: unknown };
  if (typeof active !== "boolean") return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });

  // Wait for the owner's transaction: a hash is not a result.
  if (typeof txHash === "string") {
    const receipt = await waitForTransaction(txHash);
    if (!receipt.success) {
      return NextResponse.json({ error: `transaction reverted: ${receipt.revertReason}` }, { status: 409 });
    }
  }

  // Trust the chain, not the client: only mark active if the session is live on-chain.
  if (active) {
    const wallet = await chipi.getWallet({ externalUserId: userId });
    if (!wallet) return NextResponse.json({ error: "no wallet" }, { status: 404 });
    const onChain = await chipi.sessions.getSessionData({
      walletAddress: wallet.publicKey,
      sessionPublicKey: agent.session.publicKey,
    });
    if (!onChain.isActive) return NextResponse.json({ error: "session not active on-chain yet" }, { status: 409 });
  }

  saveAgent(userId, { ...agent, active });
  return NextResponse.json({ active, sessionPublicKey: agent.session.publicKey });
}
