import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { chipi } from "@/lib/chipi";
import { getAgent } from "@/lib/agent-store";

/** GET: the agent's session as the wallet contract sees it, plus recent decisions. */
export async function GET() {
  const { userId } = await auth();
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
    onChain,
    decisions: agent.decisions.slice(-10).reverse(),
  });
}
