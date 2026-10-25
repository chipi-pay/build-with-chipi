"use client";

import { useCallback, useEffect, useState } from "react";
import { CrossChainDepositError, useCrossChainDeposit } from "@chipi-stack/nextjs";
import { formatCctpEta, type CctpFinality, type CctpQuote, type CctpStep } from "@chipi-stack/backend";
import { getChipiToken } from "@/lib/chipi-token";
import { USDC_DECIMALS, formatUnits, parseUsdcInput } from "@/lib/config";
import { BASE, baseUsdcBalance } from "@/lib/base";
import { readPendingDepositRaw, savePendingDeposit } from "@/lib/deposit-store";
import type { ConnectedEvmWallet } from "./pick-evm-wallet";

/** What the user reads at each step. The duration is the SDK's estimate for the route, never a number typed here. */
function stepLabel(step: CctpStep, eta: string | null): string {
  switch (step) {
    case "quoting":
      return "Getting Circle's quote…";
    case "switching-chain":
      return "Switch your wallet to Base…";
    case "approving":
      return "Approve USDC in your wallet…";
    case "burning":
      return "Confirm the deposit in your wallet…";
    case "registering":
      return "Sent on Base. Registering it with Chipi…";
    case "attesting":
      return `Circle is attesting the transfer (${eta}). You can close this page: the USDC arrives on its own.`;
    case "minting":
      return `Minting on Starknet (${eta})…`;
    case "recording":
      return "Recording the deposit…";
    case "done":
      return "Arrived in your Chipi wallet.";
    default:
      return "Working…";
  }
}

/**
 * Quote both speeds, let the user pick, then one hook call does the rest:
 * switch the wallet to Base, approve + depositForBurn (one prompt when the
 * wallet batches, two otherwise), register the burn with Chipi, wait for the
 * Starknet mint, record it. The recipient is the Chipi wallet, checked by the
 * SDK before anything is signed.
 */
export function FundFromBase({ evm, chipiWallet }: { evm: ConnectedEvmWallet; chipiWallet: string }) {
  const { quote, depositAsync, isLoading } = useCrossChainDeposit();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [amount, setAmount] = useState("");
  const [quotes, setQuotes] = useState<Record<CctpFinality, CctpQuote> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const readBalance = useCallback(() => baseUsdcBalance(evm.account), [evm.account]);
  useEffect(() => {
    let cancelled = false;
    readBalance().then((b) => {
      if (!cancelled) setBalance(b);
    });
    return () => {
      cancelled = true;
    };
  }, [readBalance]);

  // One record per Chipi wallet (lib/deposit-store.ts): a second deposit would
  // replace the hash step 5 is following. Finish or forget it first.
  const inFlight = () => {
    if (!readPendingDepositRaw(chipiWallet)) return false;
    setError("A deposit is already in flight for this wallet. Wait for it in step 5, or forget it there, before starting another.");
    return true;
  };

  const getQuotes = async () => {
    if (inFlight()) return;
    const units = parseUsdcInput(amount);
    if (!units) return setError("Enter an amount of USDC, up to 6 decimals.");
    if (balance !== null && units > balance) return setError(`${evm.wallet.info.name} holds ${formatUnits(balance, USDC_DECIMALS)} USDC on Base.`);
    setBusy(true);
    setError(null);
    try {
      // Both speeds, from Circle's fee API and attestation times: fee, net amount, ETA.
      setQuotes(await quote({ chain: BASE, amount: formatUnits(units, USDC_DECIMALS) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const deposit = async (finality: CctpFinality) => {
    if (!quotes || inFlight()) return;
    const q = quotes[finality];
    setError(null);
    try {
      const result = await depositAsync({
        provider: evm.wallet.provider,
        account: evm.account,
        chain: BASE,
        amount: q.amountUsdc,
        walletAddress: chipiWallet, // the Chipi wallet: the only possible recipient
        finality, // "standard": free; "fast": Circle's fee, taken from the amount
        getBearerToken: getChipiToken, // asked fresh at every step; tokens expire during the wait
        onStatus: ({ step, eta, burnTxHash }) => {
          // The moment the burn hash exists, remember it: step 5 follows it even after a reload.
          if (burnTxHash && !readPendingDepositRaw(chipiWallet)) {
            savePendingDeposit(chipiWallet, { burnTxHash, amountUsdc: q.amountUsdc, startedAt: Date.now() });
          }
          setStatus(stepLabel(step, formatCctpEta(eta)));
        },
      });
      setQuotes(null);
      setAmount("");
      setBalance(await readBalance());
      setStatus(
        result.mintTxHash
          ? `Arrived. Starknet mint: ${result.mintTxHash}`
          : "Still in flight after the page's wait. Chipi completes it; step 5 follows it."
      );
    } catch (err) {
      setStatus(null);
      if (err instanceof CrossChainDepositError) {
        // The USDC left Base. Nothing is lost: the burn is registered (or can be) and step 5 follows it.
        setError(`${err.message} Burn: ${err.burnTxHash}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">
        {evm.wallet.info.name} holds {balance === null ? "…" : formatUnits(balance, USDC_DECIMALS)} USDC on Base. It pays Base&apos;s
        gas (cents). Chipi pays the Starknet mint.
      </p>
      {!quotes && (
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="USDC"
            inputMode="decimal"
            disabled={busy || isLoading}
            className="w-32 rounded border border-zinc-700 bg-transparent px-2 py-2"
          />
          <button onClick={getQuotes} disabled={busy || isLoading || !amount} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
            {busy ? "…" : "Quote both speeds"}
          </button>
        </div>
      )}
      {quotes && !isLoading && (
        <div className="flex flex-col gap-2">
          <button onClick={() => deposit("standard")} className="rounded border border-zinc-700 px-4 py-2 text-left">
            <span className="font-medium">Free · {formatCctpEta(quotes.standard.eta)}</span>
            <span className="block text-xs text-zinc-400">You receive {quotes.standard.receivesUsdc} USDC.</span>
          </button>
          <button onClick={() => deposit("fast")} className="rounded border border-zinc-700 px-4 py-2 text-left">
            <span className="font-medium">Fast · {formatCctpEta(quotes.fast.eta)}</span>
            <span className="block text-xs text-zinc-400">
              Circle takes {quotes.fast.feeUsdc} USDC ({quotes.fast.feeBps} bps) from the amount. You receive {quotes.fast.receivesUsdc} USDC.
            </span>
          </button>
          <button onClick={() => setQuotes(null)} className="w-fit text-xs text-zinc-400 underline">
            Change the amount
          </button>
        </div>
      )}
      {status && <p className="text-sm text-zinc-300">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
