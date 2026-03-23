"use client";

import { useState } from "react";
import { useMigrateWalletToPasskey } from "@chipi-stack/nextjs";

interface MigrateToPasskeyProps {
  wallet: any;
  userId: string;
  getToken: () => Promise<string | null>;
}

export default function MigrateToPasskey({
  wallet,
  userId,
  getToken,
}: MigrateToPasskeyProps) {
  const [currentPin, setCurrentPin] = useState("");
  const { migrateWalletToPasskeyAsync, isLoading, error } =
    useMigrateWalletToPasskey();

  const handleMigrate = async (e: React.FormEvent) => {
    e.preventDefault();

    const bearerToken = await getToken();
    if (!bearerToken) {
      console.error("No bearer token available");
      return;
    }

    try {
      const result = await migrateWalletToPasskeyAsync({
        wallet: {
          publicKey: wallet.publicKey,
          encryptedPrivateKey: wallet.encryptedPrivateKey,
        },
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken,
      });

      // DOCS-ISSUE: Documentation doesn't specify where to store the updated wallet and credentialId
      // Storing in localStorage for now as per example in passkey guide
      localStorage.setItem("wallet", JSON.stringify(result.wallet));
      localStorage.setItem("passkeyCredentialId", result.credentialId);

      alert("Successfully migrated to passkey!");
      setCurrentPin("");
    } catch (err) {
      console.error("Migration failed:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-2">Migrate to Passkey</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upgrade your wallet security with biometric authentication
      </p>

      <form onSubmit={handleMigrate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Current PIN
          </label>
          <input
            type="password"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            placeholder="Enter your current PIN"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> After migration, your current PIN will no
            longer work. You'll use biometric authentication instead.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !currentPin}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
        >
          {isLoading ? "Migrating..." : "Migrate to Passkey"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}