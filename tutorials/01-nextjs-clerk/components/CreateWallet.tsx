"use client";

import { useCreateWallet } from "@chipi-stack/nextjs";
import { useState } from "react";

interface CreateWalletProps {
  userId: string;
  getToken: () => Promise<string | null>;
  isLoading?: boolean;
  error?: Error | null;
}

export default function CreateWalletComponent({
  userId,
  getToken,
}: CreateWalletProps) {
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
      const result = await createWalletAsync({
        params: {
          encryptKey: pin,
          externalUserId: userId,
          chain: "STARKNET",
          walletType: "CHIPI", // supports session keys
        },
        bearerToken,
      });

      console.log("Wallet created:", result);
      alert("Wallet created successfully! Refresh to see your balance.");
      setPin("");
    } catch (err) {
      console.error("Wallet creation failed:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Wallet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Set PIN Code
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            minLength={4}
            placeholder="Enter a secure PIN"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold"
        >
          {isLoading ? "Creating..." : "Create Wallet"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          Error: {error.message}
        </div>
      )}

      {data && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Wallet Details</h3>
            <a
              href={`https://starkscan.co/contract/${data.wallet.publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
            >
              View Contract
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Address:</span>
              <span className="ml-2 font-mono text-xs break-all">
                {data.wallet.publicKey}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">TX Hash:</span>
              <span className="ml-2 font-mono text-xs break-all">
                {data.txHash}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}