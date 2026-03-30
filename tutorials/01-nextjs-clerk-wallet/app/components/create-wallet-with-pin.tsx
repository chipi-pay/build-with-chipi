"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Chain, useCreateWallet } from "@chipi-stack/nextjs";

export function CreateWalletWithPin() {
  const { userId, getToken } = useAuth();
  const { createWalletAsync, data, isLoading, error } = useCreateWallet();
  const [pin, setPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bearerToken = await getToken();
    if (!bearerToken || !userId) {
      console.error("No bearer token or user ID available");
      return;
    }
    try {
      await createWalletAsync({
        params: {
          encryptKey: pin,
          externalUserId: userId,
          chain: Chain.STARKNET,
          walletType: "CHIPI", // supports session keys
        },
        bearerToken,
      });
      alert("Wallet created successfully!");
    } catch (err) {
      console.error("Wallet creation failed:", err);
    }
  };

  return (
    <div className="vapor-card">
      <h2 className="vapor-title">Create Wallet with PIN</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="vapor-label">Set PIN Code</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="vapor-input"
            required
            minLength={4}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="vapor-btn-primary w-full disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Create Wallet"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-red-300">Error: {error.message}</p>
      )}

      {data && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-zinc-200">Wallet Details</h3>
            <a
              href={`https://starkscan.co/contract/${data.publicKey}`}
              target="_blank"
              rel="noopener"
              className="text-sm flex items-center gap-1 text-cyan-300 hover:text-fuchsia-300"
            >
              View Contract
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-200">
              <span className="font-medium text-zinc-400">Address:</span>
              <span className="ml-2 font-mono break-all text-cyan-200">{data.publicKey}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
