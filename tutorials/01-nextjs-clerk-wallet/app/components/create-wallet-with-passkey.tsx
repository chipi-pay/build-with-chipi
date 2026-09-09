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
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const handleCreate = async () => {
    setDeviceError(null);
    try {
      const bearerToken = await getToken();
      if (!bearerToken) {
        console.error("No Clerk session token");
        return;
      }

      // createWalletPasskey requires WebAuthn PRF by default. On an authenticator
      // that can't produce a PRF secret it throws PrfUnsupportedError instead of
      // creating a wallet whose key the backend could reconstruct (custodial).
      const { encryptKey, credentialId } = await createWalletPasskey(userId, userId);

      const result = await createWalletAsync({
        params: {
          encryptKey,
          externalUserId: userId,
          chain: Chain.STARKNET,
        },
        bearerToken,
      });

      localStorage.setItem(`wallet_${userId}`, JSON.stringify(result));
      localStorage.setItem(`credentialId_${userId}`, credentialId);
      setWallet(result);
    } catch (err) {
      // Tell the user it's the device, not a transient failure worth retrying here.
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "PRF_UNSUPPORTED"
      ) {
        setDeviceError(
          "This device can't create a secure wallet. Try another phone or browser that supports passkeys (Face ID or fingerprint).",
        );
        return;
      }
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
      {deviceError && <p className="mt-2 text-red-300">{deviceError}</p>}
      {error && <p className="mt-2 text-red-300">Error: {error.message}</p>}
      {wallet && (
        <p className="mt-4 text-sm font-mono text-zinc-100">
          Wallet created: {wallet.publicKey}
        </p>
      )}
    </div>
  );
}
