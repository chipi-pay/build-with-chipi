import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Chain, ChainToken, isThinkDecision, waitForTransaction } from "@chipi-stack/backend";
import { agentSessionSecret, chipi } from "@/lib/chipi";
import { getAgent, saveAgent } from "@/lib/agent-store";
import { MAX_AI_PRICE_USDC, MAX_TRADE_USD, TRADABLE } from "@/lib/limits";

/** selector("Transfer"), the ERC-20 event. */
const TRANSFER = BigInt("0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9");

/**
 * Did a token leave or reach the wallet? A call the wallet refuses (over a
 * cap, not whitelisted, revoked session) still comes back `success: true`
 * through the paymaster, with nothing moved.
 */
function movedFunds(events: { keys: string[]; data: string[] }[], wallet: string): boolean {
  const me = BigInt(wallet);
  return events.some(
    (e) =>
      BigInt(e.keys[0] ?? 0) === TRANSFER &&
      [e.keys[1], e.keys[2]].some((k) => k !== undefined && BigInt(k) === me)
  );
}

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

  const wallet = await chipi().getWallet({ externalUserId: userId });
  if (!wallet) return NextResponse.json({ error: "no wallet" }, { status: 404 });

  // 1. Session still live? (expired, revoked elsewhere, or out of calls)
  const onChain = await chipi().sessions.getSessionData({
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
      chipi().getTokenBalance({ walletPublicKey: wallet.publicKey, chainToken, chain: Chain.STARKNET })
    )
  );
  const portfolio = Object.fromEntries(balances.map((b) => [b.chainToken, { balance: b.balance }]));

  // 3. Decide. Billed to your org's AI credits; when they run out, Chipi asks
  // for $0.015 over x402 and the agent pays it from its session (capped).
  const { decision } = await chipi().ai.think(
    { portfolio, riskScore: 3 },
    {
      payWithSession: {
        encryptKey: agentSessionSecret(),
        wallet,
        session: agent.session,
        maxAmount: MAX_AI_PRICE_USDC,
      },
    }
  );
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
  const { calls } = await chipi().ai.execute({
    chain: "starknet",
    action: "swap",
    from,
    to,
    amountUsd,
    walletAddress: wallet.publicKey,
    slippage: 0.01,
  });
  const txHash = await chipi().executeTransactionWithSession({
    params: { encryptKey: agentSessionSecret(), wallet, session: agent.session, calls },
  });

  // 6. A hash is not a result, and neither is `success`: a swap the wallet
  // refused (over a cap) succeeds with nothing moved. The Transfer is the proof.
  const receipt = await waitForTransaction(txHash);
  const success = receipt.success && movedFunds(receipt.events, wallet.publicKey);
  record(`swap ${from} -> ${to} ($${amountUsd})`, decision.reason, { txHash, success });

  return NextResponse.json({
    action: "swap",
    txHash,
    success,
    reason: success ? undefined : receipt.revertReason ?? "refused by the wallet: nothing moved",
  });
}
