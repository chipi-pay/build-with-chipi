"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import CreateWalletWithPasskey from "@/components/CreateWalletWithPasskey";
import MigrateToPasskey from "@/components/MigrateToPasskey";
import TransferWithPasskey from "@/components/TransferWithPasskey";
import { useState, useEffect } from "react";

export default function PasskeyPage() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const [hasWallet, setHasWallet] = useState(false);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      try {
        const parsed = JSON.parse(storedWallet);
        setWallet(parsed);
        setHasWallet(true);
      } catch (e) {
        console.error("Failed to parse wallet", e);
      }
    }
  }, []);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <p className="text-gray-700">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-green-600">
              ← Chipi Wallet
            </Link>
            <div className="text-sm text-gray-600">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Passkey Authentication
          </h1>
          <p className="text-gray-600">
            Secure your wallet with biometric authentication (Face ID, Touch ID,
            Windows Hello)
          </p>
        </div>

        <div className="space-y-6">
          {!hasWallet ? (
            <CreateWalletWithPasskey
              userId={userId}
              onWalletCreated={(w) => {
                setWallet(w);
                setHasWallet(true);
              }}
            />
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Wallet Address</h2>
                <p className="font-mono text-sm break-all text-gray-700">
                  {wallet?.publicKey}
                </p>
              </div>

              <MigrateToPasskey userId={userId} />

              <TransferWithPasskey />
            </>
          )}
        </div>
      </main>
    </div>
  );
}