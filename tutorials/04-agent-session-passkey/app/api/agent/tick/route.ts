import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Chain, ChainToken, isThinkDecision, waitForTransaction } from "@chipi-stack/backend";
import { agentSessionSecret, chipi } from "@/lib/chipi";
import { getAgent, saveAgent } from "@/lib/agent-store";
import { MAX_TRADE_USD, TRADABLE } from "@/lib/limits";

/**
 * POST: one agent decision.
 *
 * A button calls it here; in production a cron does, for every active agent.
 * The agent signs with its session key only. It never touches the owner key.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = getAgent(userId);
  if (!agent?.active) return NextResponse.json({ error: "agent not hired" }, { status: 409 });

  const wallet = await chipi.getWallet({ externalUserId: userId });
  if (!wallet) return NextResponse.json({ error: "no wallet" }, { status: 404 });

  // 1. Session still live? (expired, revoked elsewhere, or out of calls)
  const onChain = await chipi.sessions.getSessionData({
    walletAddress: wallet.publicKey,
    sessionPublicKey: agent.session.publicKey,
  });
  if (!onChain.isActive) {
    saveAgent(userId, { ...agent, active: false });
    return NextResponse.json({ error: "session no longer active" }, { status: 409 });
  }

  // 2. Portfolio
  const balances = await Promise.all(
    [ChainToken.USDC, ChainToken.ETH, ChainToken.STRK].map((chainToken) =>
      chipi.getTokenBalance({ walletPublicKey: wallet.publicKey, chainToken, chain: Chain.STARKNET })
    )
  );
  const portfolio = Object.fromEntries(balances.map((b) => [b.chainToken, { balance: b.balance }]));

  // 3. Decide (billed to your org's AI credits)
  const { decision } = await chipi.ai.think({ portfolio, riskScore: 3 });
  const record = (action: string, reason: string, extra: { txHash?: string; success?: boolean } = {}) =>
    saveAgent(userId, {
      ...agent,
      decisions: [...agent.decisions, { at: new Date().toISOString(), action, reason, ...extra }],
    });

  // 4. Validate: a reply that is not a known decision is a hold.
  if (!isThinkDecision(decision)) {
    record("hold", "model reply was not a valid decision");
    return NextResponse.json({ action: "hold" });
  }
  if (decision.action !== "swap") {
    record(decision.action === "hold" ? "hold" : `hold (${decision.action} not enabled)`, decision.reason);
    return NextResponse.json({ action: "hold" });
  }
  const from = decision.from?.toUpperCase();
  const to = decision.to?.toUpperCase();
  if (!from || !to || from === to || !TRADABLE.has(from) || !TRADABLE.has(to)) {
    record("hold", `rejected swap ${decision.from} -> ${decision.to}`);
    return NextResponse.json({ action: "hold" });
  }
  // Our cap, never the model's amount alone.
  const amountUsd = Math.min(decision.amount ?? 0, MAX_TRADE_USD);
  if (amountUsd <= 0) {
    record("hold", "no amount");
    return NextResponse.json({ action: "hold" });
  }

  // 5. Build the swap and sign it with the session key
  const { calls } = await chipi.ai.execute({
    chain: "starknet",
    action: "swap",
    from,
    to,
    amountUsd,
    walletAddress: wallet.publicKey,
    slippage: 0.01,
  });
  const txHash = await chipi.executeTransactionWithSession({
    params: { encryptKey: agentSessionSecret(), wallet, session: agent.session, calls },
  });

  // 6. A hash is not a result. A cap breach reverts here.
  const receipt = await waitForTransaction(txHash);
  record(`swap ${from} -> ${to} ($${amountUsd})`, decision.reason, { txHash, success: receipt.success });

  return NextResponse.json({ action: "swap", txHash, success: receipt.success, revertReason: receipt.revertReason });
}
