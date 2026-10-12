"use client";

import { useCallback, useEffect, useState } from "react";
import { waitForTransaction } from "@chipi-stack/backend";
import { brambleErrorMessage, requireBrambleAccount, sendUsdc, type Bramble } from "@/lib/bramble";
import { MIN_STRK_FOR_FEES, TOKENS, USDC_DECIMALS, formatUnits, parseUsdc } from "@/lib/config";
import { balanceOf } from "@/lib/starknet";

interface Balances {
  brambleUsdc: bigint;
  brambleStrk: bigint;
  walletUsdc: bigint;
}

/**
 * Funds the Chipi wallet from Bramble: one USDC transfer that Bramble shows,
 * signs and pays the fee for (in STRK; Bramble has no paymaster for dApps).
 */
export function FundFromBramble({ bramble, brambleAddress, walletAddress }: { bramble: Bramble; brambleAddress: string; walletAddress: string }) {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readBalances = useCallback(
    async (): Promise<Balances> => ({
      brambleUsdc: await balanceOf(TOKENS.USDC, brambleAddress),
      brambleStrk: await balanceOf(TOKENS.STRK, brambleAddress),
      walletUsdc: await balanceOf(TOKENS.USDC, walletAddress),
    }),
    [brambleAddress, walletAddress]
  );

  useEffect(() => {
    let cancelled = false;
    readBalances().then((next) => {
      if (!cancelled) setBalances(next);
    });
    return () => {
      cancelled = true;
    };
  }, [readBalances]);

  const send = async () => {
    const units = parseUsdc(amount);
    if (!units) return setError("Enter an amount of USDC, up to 6 decimals.");
    if (balances && units > balances.brambleUsdc) return setError("Bramble doesn't hold that much USDC.");
    if (balances && balances.brambleStrk < MIN_STRK_FOR_FEES) return setError("Bramble needs some STRK (0.1 or more) to pay the network fee.");
    setBusy(true);
    setError(null);
    try {
      await requireBrambleAccount(bramble, brambleAddress);
      setStatus("Approve the transfer in Bramble…");
      const txHash = await sendUsdc(bramble, walletAddress, units);
      setStatus("Sent. Waiting for Starknet…");
      // A hash is not a result.
      const receipt = await waitForTransaction(txHash);
      if (!receipt.success) throw new Error(`The transfer reverted: ${receipt.revertReason ?? "unknown reason"}`);
      setStatus(`Deposited ${formatUnits(units, USDC_DECIMALS)} USDC.`);
      setAmount("");
      setBalances(await readBalances());
    } catch (err) {
      setStatus(null);
      setError(brambleErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {balances && (
        <p className="text-sm text-zinc-400">
          Bramble: {formatUnits(balances.brambleUsdc, USDC_DECIMALS)} USDC · {formatUnits(balances.brambleStrk, 18)} STRK. Chipi
          wallet: {formatUnits(balances.walletUsdc, USDC_DECIMALS)} USDC.
        </p>
      )}
      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="USDC"
          inputMode="decimal"
          className="w-32 rounded border border-zinc-700 bg-transparent px-2 py-2"
        />
        <button onClick={send} disabled={busy} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
          {busy ? "Waiting…" : "Send from Bramble"}
        </button>
      </div>
      {status && <p className="text-sm text-zinc-300">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
