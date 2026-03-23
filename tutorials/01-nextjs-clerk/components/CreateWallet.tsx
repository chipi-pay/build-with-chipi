"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCreateWallet } from "@chipi-stack/nextjs";
import { createWalletPasskey } from "@chipi-stack/chipi-passkey";

export default function CreateWallet() {
  const { userId, getToken } = useAuth();
  const { createWalletAsync, data, isLoading, error } = useCreateWallet();
  const [pin, setPin] = useState("");
  const [usePasskey, setUsePasskey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bearerToken = await getToken();
    if (!bearerToken || !userId) {
      console.error("No bearer token or user ID available");
      return;
    }

    try {
      let encryptKey = pin;

      if (usePasskey) {
        // Create wallet with passkey
        const result = await createWalletPasskey({
          externalUserId: userId,
          bearerToken,
          chain: "STARKNET",
          walletType: "CHIPI",
        });
        alert("Wallet created successfully with passkey!");
        console.log("Wallet:", result.wallet);
        // Store wallet for future use
        localStorage.setItem("wallet", JSON.stringify(result.wallet));
        localStorage.setItem("passkeyCredentialId", result.credentialId);
        return;
      }

      // Create wallet with PIN
      const wallet = await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: userId,
          chain: "STARKNET",
          walletType: "CHIPI",
        },
        bearerToken,
      });
      alert("Wallet created successfully!");
      // Store wallet for future use
      localStorage.setItem("wallet", JSON.stringify(wallet.wallet));
    } catch (err) {
      console.error("Wallet creation failed:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Wallet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="usePasskey"
            checked={usePasskey}
            onChange={(e) => setUsePasskey(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="usePasskey" className="text-sm text-gray-700">
            Use Passkey (biometric authentication)
          </label>
        </div>

        {!usePasskey && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Set PIN Code
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              required
              minLength={4}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? "Creating..." : usePasskey ? "Create with Passkey" : "Create Wallet"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          Error: {error.message}
        </div>
      )}

      {data && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Wallet Details</h3>
            <a
              href={`https://starkscan.co/contract/${data.wallet.publicKey}`}
              target="_blank"
              rel="noopener"
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
              <span className="ml-2 font-mono break-all">
                {data.wallet.publicKey}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">TX Hash:</span>
              <span className="ml-2 font-mono break-all">{data.txHash}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}