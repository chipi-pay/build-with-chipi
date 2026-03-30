"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { Chain, ChainToken, useGetTokenBalance, useGetWallet } from "@chipi-stack/nextjs";
import { Toaster } from "sonner";
import { CreateWalletWithPin } from "./create-wallet-with-pin";
import { CreateWalletWithPasskey } from "./create-wallet-with-passkey";
import { TransferWithPinAndPasskey } from "./transfer-with-pin-and-passkey";
import { TransactionListTable } from "./transaction-list-table";

function formatBalance(balance: string, decimals: number): string {
  const normalized = balance.trim();
  if (!normalized) return "0";

  if (normalized.includes(".")) {
    const [whole, frac = ""] = normalized.split(".");
    const safeWhole = whole === "" ? "0" : whole;
    const safeFrac = frac.replace(/0+$/, "");
    return safeFrac ? `${safeWhole}.${safeFrac}` : safeWhole;
  }

  if (!/^-?\d+$/.test(normalized)) {
    const asNumber = Number(normalized);
    if (Number.isFinite(asNumber)) return asNumber.toString();
    return "0";
  }

  const n = BigInt(normalized);
  const d = BigInt(10) ** BigInt(decimals);
  const whole = n / d;
  const frac = n % d;
  if (frac === BigInt(0)) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function WalletDashboard() {
  const { isSignedIn, userId, getToken } = useAuth();

  const {
    data: wallet,
    isLoading: walletLoading,
    error: walletError,
    fetchWallet,
  } = useGetWallet({
    params: { externalUserId: userId || "" },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: { enabled: Boolean(userId) },
  });

  const {
    data: tokenBalance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useGetTokenBalance({
    params: {
      chainToken: ChainToken.USDC,
      chain: Chain.STARKNET,
      walletPublicKey: wallet?.publicKey ?? "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: { enabled: Boolean(userId && wallet?.publicKey) },
  });

  const loadWallet = async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");

      await fetchWallet({
        params: { externalUserId: userId },
        getBearerToken: async () => token,
      });
      void refetchBalance();
    } catch (err) {
      console.error("Error loading wallet:", err);
    }
  };

  return (
    <div className="min-h-screen p-6 text-zinc-100">
      <Toaster richColors closeButton position="top-right" />
      <div className="vapor-grid" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {!isSignedIn && (
          <div className="flex min-h-[80vh] items-center justify-center">
            <SignIn />
          </div>
        )}

        {isSignedIn && userId && (
          <>
            <header className="vapor-card">
              <p className="vapor-kicker">CHIPI WALLET // TESTER BUILD</p>
              <h1 className="vapor-hero">Gasless Wallet Validation</h1>
              <p className="text-sm text-zinc-300">
                Covers PIN flow, passkey flow, transfer status polling, and docs validation.
              </p>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
              <CreateWalletWithPin />
              <CreateWalletWithPasskey userId={userId} />
            </section>

            {walletLoading && <p className="text-zinc-300">Loading wallet...</p>}
            {walletError != null && (
              <p className="text-red-400">
                Wallet error: {walletError instanceof Error ? walletError.message : String(walletError)}
              </p>
            )}

            {wallet && (
              <div className="vapor-card text-zinc-100">
                <p className="break-all font-mono text-sm">
                  <span className="text-zinc-400">Public Key: </span>
                  {wallet.publicKey}
                </p>
                <p className="mt-2 break-all font-mono text-sm">
                  <span className="text-zinc-400">Normalized: </span>
                  {wallet.normalizedPublicKey}
                </p>
                <button
                  type="button"
                  onClick={loadWallet}
                  className="mt-3 text-cyan-300 underline underline-offset-2 hover:text-fuchsia-300"
                >
                  Refetch wallet
                </button>
              </div>
            )}

            {wallet?.publicKey && (
              <div className="vapor-card">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-zinc-300">USDC balance (Starknet)</h2>
                  <button
                    type="button"
                    className="vapor-btn-ghost"
                    disabled={balanceLoading}
                    onClick={() => void refetchBalance()}
                  >
                    {balanceLoading ? "Refreshing..." : "Refetch balance"}
                  </button>
                </div>
                {balanceLoading && <p className="text-zinc-400">Loading balance...</p>}
                {balanceError != null && (
                  <p className="text-red-400">
                    Balance error: {balanceError instanceof Error ? balanceError.message : String(balanceError)}
                  </p>
                )}
                {tokenBalance && !balanceLoading && (
                  <div className="space-y-1 font-mono text-sm">
                    <p>
                      <span className="text-zinc-400">Raw: </span>
                      <span className="text-zinc-100">{tokenBalance.balance}</span>
                    </p>
                    <p>
                      <span className="text-zinc-400">Formatted: </span>
                      <span className="text-lg font-semibold text-green-400">
                        {formatBalance(tokenBalance.balance, tokenBalance.decimals)} {tokenBalance.chainToken}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {wallet && (
              <section className="grid gap-4 md:grid-cols-2">
                <TransferWithPinAndPasskey wallet={wallet} />
                <div className="vapor-card">
                  <h2 className="vapor-title">Receive</h2>
                  <p className="text-xs text-zinc-300">Share your address or QR to receive USDC.</p>
                  <Image
                    className="mt-3 rounded border border-fuchsia-500/40 bg-white p-2"
                    width={180}
                    height={180}
                    alt="Wallet QR"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(wallet.publicKey)}`}
                  />
                  <p className="mt-3 break-all font-mono text-xs text-cyan-300">{wallet.publicKey}</p>
                </div>
              </section>
            )}

            <TransactionListTable walletAddress={wallet?.publicKey} getBearerToken={getToken} />
          </>
        )}
      </div>
    </div>
  );
}

