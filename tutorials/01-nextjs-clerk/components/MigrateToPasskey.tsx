"use client";

import { useMigrateWalletToPasskey } from "@chipi-stack/nextjs";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface MigrateToPasskeyProps {
  userId: string;
}

export default function MigrateToPasskey({ userId }: MigrateToPasskeyProps) {
  const { getToken } = useAuth();
  const { migrateWalletToPasskeyAsync, isLoading } =
    useMigrateWalletToPasskey();
  const [currentPin, setCurrentPin] = useState("");

  const handleMigrate = async () => {
    try {
      const walletStr = localStorage.getItem("wallet");
      if (!walletStr) {
        alert("No wallet found to migrate");
        return;
      }

      const wallet = JSON.parse(walletStr);

      const bearerToken = await getToken();
      if (!bearerToken) {
        alert("Authentication required");
        return;
      }

      // Validates PIN first, then triggers biometric prompt internally
      const result = await migrateWalletToPasskeyAsync({
        wallet,
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken,
      });

      // Store updated wallet and credentialId
      localStorage.setItem("wallet", JSON.stringify(result.wallet));
      localStorage.setItem("credentialId", result.credentialId);

      alert("Successfully migrated to passkey!");
      setCurrentPin("");
    } catch (err: any) {
      console.error("Migration failed:", err);
      alert(`Error: ${err.message || "Migration failed"}`);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Migrate to Passkey</h2>
      <p className="text-sm text-gray-600">
        Convert your PIN-based wallet to use biometric authentication
      </p>

      <input
        type="password"
        placeholder="Current PIN"
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value)}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        onClick={handleMigrate}
        disabled={isLoading || !currentPin}
        className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400 font-semibold"
      >
        {isLoading ? "Migrating..." : "Migrate to Passkey"}
      </button>
    </div>
  );
}