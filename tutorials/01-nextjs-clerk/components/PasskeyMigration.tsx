"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMigrateWalletToPasskey } from "@chipi-stack/chipi-passkey/hooks";

interface PasskeyMigrationProps {
  wallet: {
    publicKey: string;
    encryptedPrivateKey: string;
  };
}

export default function PasskeyMigration({ wallet }: PasskeyMigrationProps) {
  const { userId, getToken } = useAuth();
  const { migrateWalletToPasskeyAsync, isLoading } =
    useMigrateWalletToPasskey();
  const [currentPin, setCurrentPin] = useState("");
  const [showMigration, setShowMigration] = useState(false);

  const handleMigrate = async () => {
    const bearerToken = await getToken();
    if (!bearerToken || !userId) return;

    try {
      const result = await migrateWalletToPasskeyAsync({
        wallet,
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken,
      });

      // Store updated wallet and credential ID
      localStorage.setItem("wallet", JSON.stringify(result.wallet));
      localStorage.setItem("passkeyCredentialId", result.credentialId);

      alert("Successfully migrated to passkey!");
      setShowMigration(false);
      setCurrentPin("");
    } catch (err) {
      console.error("Migration failed:", err);
    }
  };

  if (!showMigration) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Upgrade to Passkey</h2>
        <p className="text-gray-600 mb-4">
          Enable biometric authentication for enhanced security and convenience.
        </p>
        <button
          onClick={() => setShowMigration(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Migrate to Passkey
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Migrate to Passkey</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current PIN
          </label>
          <input
            type="password"
            placeholder="Enter your current PIN"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMigrate}
            disabled={isLoading || !currentPin}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading ? "Migrating..." : "Migrate to Passkey"}
          </button>
          <button
            onClick={() => {
              setShowMigration(false);
              setCurrentPin("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-sm text-gray-500">
          This will enable biometric authentication (Face ID, Touch ID, Windows
          Hello) for your wallet.
        </p>
      </div>
    </div>
  );
}