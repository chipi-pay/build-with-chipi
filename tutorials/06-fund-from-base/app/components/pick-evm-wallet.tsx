"use client";

import { useEffect, useState } from "react";
import { discoverEvmWallets, type EvmWalletDetail } from "@chipi-stack/backend";

export interface ConnectedEvmWallet {
  wallet: EvmWalletDetail;
  account: `0x${string}`;
}

/**
 * Lists the EVM wallets installed in this browser (EIP-6963: MetaMask, Rabby,
 * Coinbase Wallet, …; `window.ethereum` as a fallback) and connects one. The
 * SDK switches it to Base later, so it may be on any chain now.
 */
export function PickEvmWallet({ onConnected }: { onConnected: (connected: ConnectedEvmWallet) => void }) {
  const [wallets, setWallets] = useState<EvmWalletDetail[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Wallets announce themselves in response to a request; 300 ms is plenty.
    discoverEvmWallets().then((found) => {
      if (!cancelled) setWallets(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = async (wallet: EvmWalletDetail) => {
    setBusy(true);
    setError(null);
    try {
      const accounts = (await wallet.provider.request({ method: "eth_requestAccounts" })) as `0x${string}`[];
      if (!accounts[0]) throw new Error(`${wallet.info.name} returned no account.`);
      onConnected({ wallet, account: accounts[0] });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (wallets === null) return <p className="text-sm text-zinc-400">Looking for EVM wallets…</p>;
  if (wallets.length === 0) {
    return <p className="text-sm text-red-400">No EVM wallet in this browser. Install MetaMask, Rabby or Coinbase Wallet and reload.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {wallets.map((w) => (
        <button
          key={w.info.uuid}
          onClick={() => connect(w)}
          disabled={busy}
          className="flex items-center gap-3 rounded border border-zinc-700 px-4 py-2 text-left disabled:opacity-60"
        >
          {w.info.icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- wallet icons are data URIs
            <img src={w.info.icon} alt="" width={24} height={24} className="rounded" />
          ) : (
            <span className="inline-block h-6 w-6 rounded bg-zinc-700" />
          )}
          <span>{w.info.name}</span>
        </button>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
