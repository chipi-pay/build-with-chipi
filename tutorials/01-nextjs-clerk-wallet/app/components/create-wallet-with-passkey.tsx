"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Chain,
  createWalletPasskey,
  type GetWalletResponse,
  useCreateWallet,
} from "@chipi-stack/nextjs";

export function CreateWalletWithPasskey({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading, error } = useCreateWallet();
  const [wallet, setWallet] = useState<GetWalletResponse | null>(null);

  const handleCreate = async () => {
    try {
      const bearerToken = await getToken();
      if (!bearerToken) {
        console.error("No Clerk session token");
        return;
      }

      const { encryptKey, credentialId } = await createWalletPasskey(userId, userId);

      const result = await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: userId,
          chain: Chain.STARKNET,
        },
        bearerToken,
      });

      localStorage.setItem("wallet", JSON.stringify(result));
      localStorage.setItem("credentialId", credentialId);
      setWallet(result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="vapor-card">
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="vapor-btn-secondary w-full disabled:opacity-60"
      >
        {isLoading ? "Creating..." : "Create Wallet with Passkey"}
      </button>
      {error && <p className="mt-2 text-red-300">Error: {error.message}</p>}
      {wallet && (
        <p className="mt-4 text-sm font-mono text-zinc-100">
          Wallet created: {wallet.publicKey}
        </p>
      )}
    </div>
  );
}
