"use client";

import { useState } from "react";
import { useMigrateWalletToPasskey, type GetWalletResponse } from "@chipi-stack/nextjs";
import { toast } from "sonner";

type Props = {
  wallet: GetWalletResponse;
  userId: string;
  getBearerToken: () => Promise<string | null>;
  onMigrationSuccess?: (updated: {
    publicKey: string;
    encryptedPrivateKey: string;
  }) => void | Promise<void>;
};

export function MigrateWalletToPasskey({ wallet, userId, getBearerToken, onMigrationSuccess }: Props) {
  const [currentPin, setCurrentPin] = useState("");
  const { migrateWalletToPasskeyAsync, isLoading, error } = useMigrateWalletToPasskey();

  const handleMigrate = async () => {
    const bearerToken = await getBearerToken();
    if (!bearerToken) {
      toast.error("No bearer token available");
      return;
    }

    try {
      const encryptedPrivateKey = (wallet as unknown as { encryptedPrivateKey?: string })
        .encryptedPrivateKey;

      if (!encryptedPrivateKey) {
        toast.error("Wallet is missing encryptedPrivateKey for migration");
        return;
      }

      const result = await migrateWalletToPasskeyAsync({
        wallet: {
          publicKey: wallet.publicKey,
          encryptedPrivateKey,
        },
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken,
      });

      if (result?.wallet?.encryptedPrivateKey) {
        await onMigrationSuccess?.({
          publicKey: result.wallet.publicKey,
          encryptedPrivateKey: result.wallet.encryptedPrivateKey,
        });
      }

      if (result?.wallet) {
        localStorage.setItem(`wallet_${userId}`, JSON.stringify(result.wallet));
      }
      if (result?.credentialId) {
        localStorage.setItem(`passkeyCredentialId_${userId}`, result.credentialId);
      }

      toast.success("Wallet migrated to passkey — you can transfer with passkey using the updated wallet.");
    } catch (err) {
      toast.error(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="vapor-card">
      <h2 className="vapor-title">Migrate Wallet to Passkey</h2>
      <p className="text-xs text-zinc-300">
        Uses <code>useMigrateWalletToPasskey</code> for PIN to passkey migration testing.
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <label className="vapor-label">Current PIN</label>
          <input
            type="password"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            className="vapor-input"
            placeholder="Enter current PIN"
            required
          />
        </div>

        <button
          type="button"
          className="vapor-btn-secondary w-full disabled:opacity-60"
          onClick={() => void handleMigrate()}
          disabled={isLoading || !currentPin}
        >
          {isLoading ? "Migrating..." : "Migrate to Passkey"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">Error: {error.message}</p>}
    </div>
  );
}
