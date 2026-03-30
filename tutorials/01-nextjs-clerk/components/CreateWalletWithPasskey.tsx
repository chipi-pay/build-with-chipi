"use client";

import { useCreateWallet } from "@chipi-stack/nextjs";
import { usePasskeySetup } from "@chipi-stack/chipi-passkey/hooks";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface CreateWalletWithPasskeyProps {
  userId: string;
  onWalletCreated?: (wallet: any) => void;
}

export default function CreateWalletWithPasskey({
  userId,
  onWalletCreated,
}: CreateWalletWithPasskeyProps) {
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading, error } = useCreateWallet();
  const { setupPasskey } = usePasskeySetup();
  const [wallet, setWallet] = useState<any>(null);

  const handleCreate = async () => {
    try {
      // Triggers biometric prompt — requires userId and display name
      const { encryptKey, credentialId } = await setupPasskey(userId, userId);

      const bearerToken = await getToken();
      if (!bearerToken) {
        alert("Authentication required");
        return;
      }

      // Create wallet with passkey-derived key
      // Do NOT pass usePasskey: true — setupPasskey already handled it
      const result = await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: userId,
          chain: "STARKNET",
        },
        bearerToken,
      });

      // Result is flat — publicKey is at top level, not nested under .wallet
      localStorage.setItem("wallet", JSON.stringify(result));
      localStorage.setItem("credentialId", credentialId);
      setWallet(result);

      if (onWalletCreated) {
        onWalletCreated(result);
      }

      alert("Wallet created with passkey!");
    } catch (err: any) {
      console.error("Failed to create wallet with passkey:", err);
      alert(`Error: ${err.message || "Failed to create wallet"}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Create Wallet with Passkey</h2>
      <p className="text-gray-600 mb-4">
        Use biometric authentication instead of a PIN
      </p>

      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400 w-full font-semibold"
      >
        {isLoading ? "Creating..." : "Create Wallet with Passkey"}
      </button>

      {error && (
        <p className="text-red-600 mt-2 text-sm">Error: {error.message}</p>
      )}

      {wallet && (
        <p className="text-sm mt-4 font-mono break-all text-gray-700">
          Wallet created: {wallet.publicKey}
        </p>
      )}
    </div>
  );
}