"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useCctpDepositStatus } from "@chipi-stack/nextjs";
import { getChipiToken } from "@/lib/chipi-token";
import { STARKNET_USDC, USDC_DECIMALS, formatUnits } from "@/lib/config";
import { BASE } from "@/lib/base";
import { balanceOf } from "@/lib/starknet";
import { clearPendingDeposit, parsePendingDeposit, readPendingDepositRaw, subscribePendingDeposit } from "@/lib/deposit-store";

/**
 * Follows the deposit remembered for this wallet by its burn hash: PENDING
 * while Circle attests and Chipi's delivery runs, MINTED with the Starknet
 * transaction. Reload, close the tab, open it on your phone: the burn hash is
 * all it needs. Also shows the Chipi wallet's USDC on Starknet.
 */
export function DepositProgress({ chipiWallet }: { chipiWallet: string }) {
  const raw = useSyncExternalStore(subscribePendingDeposit, () => readPendingDepositRaw(chipiWallet), () => null);
  const pending = useMemo(() => parsePendingDeposit(raw), [raw]);
  const [starknetUsdc, setStarknetUsdc] = useState<bigint | null>(null);

  // Polls chipi-back every 15 s while PENDING, then stops.
  const { data, error } = useCctpDepositStatus({ burnTxHash: pending?.burnTxHash ?? null, getBearerToken: getChipiToken });
  const status = data?.status;

  useEffect(() => {
    let cancelled = false;
    balanceOf(STARKNET_USDC, chipiWallet).then((b) => {
      if (!cancelled) setStarknetUsdc(b);
    });
    return () => {
      cancelled = true;
    };
  }, [chipiWallet, status]);

  // Rendering must be pure, so the start time is shown as a clock time, not an age.
  const startedAt = pending ? new Date(pending.startedAt).toLocaleTimeString() : "";

  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="text-zinc-400">
        Chipi wallet on Starknet: {starknetUsdc === null ? "…" : formatUnits(starknetUsdc, USDC_DECIMALS)} USDC
      </p>
      {!pending && <p className="text-zinc-400">No deposit in flight.</p>}
      {pending && (
        <div className="flex flex-col gap-1 rounded border border-zinc-800 p-3">
          <p>
            {pending.amountUsdc} USDC from Base, sent at {startedAt}:{" "}
            <span className="font-medium">{status ?? "checking…"}</span>
          </p>
          <a href={`${BASE.explorerTx}${pending.burnTxHash}`} target="_blank" rel="noreferrer" className="break-all font-mono text-xs underline">
            {pending.burnTxHash}
          </a>
          {status === "PENDING" && <p className="text-xs text-zinc-400">Circle attests, then Chipi mints. You can close this page.</p>}
          {status === "MINTED" && (
            <p className="text-xs text-zinc-400">
              Minted on Starknet: <span className="font-mono">{data?.mintTx}</span>
            </p>
          )}
          {status === "FAILED" && <p className="text-xs text-red-400">Chipi could not mint it. Your USDC is safe; keep the burn hash and contact support.</p>}
          {status === "UNREGISTERED" && (
            <p className="text-xs text-red-400">Chipi has no record of this burn. Keep the hash: a mint can be delivered at any time.</p>
          )}
          {error && <p className="text-xs text-red-400">{error.message}</p>}
          {status && status !== "PENDING" && (
            <button onClick={() => clearPendingDeposit(chipiWallet)} className="w-fit text-xs underline">
              Forget it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
