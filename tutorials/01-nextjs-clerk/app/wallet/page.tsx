"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useChipiWallet } from "@chipi-stack/nextjs";
import { useState } from "react";
import Link from "next/link";
import CreateWalletComponent from "@/components/CreateWallet";
import TransferComponent from "@/components/Transfer";
import TransactionListComponent from "@/components/TransactionList";
import TokenBalanceComponent from "@/components/TokenBalance";

const USDC_CONTRACT =
  "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

export default function WalletPage() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const [pin, setPin] = useState("");

  const {
    wallet,
    hasWallet,
    formattedBalance,
    createWallet,
    isLoadingWallet,
    error: walletError,
  } = useChipiWallet({
    externalUserId: userId || "",
    getBearerToken: getToken,
  });

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Wallet Dashboard
        </h1>

        {!hasWallet ? (
          <div className="max-w-md mx-auto">
            <CreateWalletComponent
              userId={userId}
              getToken={getToken}
              isLoading={isLoadingWallet}
              error={walletError}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Wallet Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  <p className="font-mono text-sm break-all text-gray-900">
                    {wallet?.publicKey}
                  </p>
                  <a
                    href={`https://starkscan.co/contract/${wallet?.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 mt-1"
                  >
                    View on Starkscan
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
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    USDC Balance
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${formattedBalance || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Token Balance Details */}
            {wallet && (
              <TokenBalanceComponent
                walletPublicKey={wallet.publicKey}
                getToken={getToken}
              />
            )}

            {/* Transfer Form */}
            {wallet && (
              <TransferComponent wallet={wallet} getToken={getToken} />
            )}

            {/* Transaction List */}
            {wallet && (
              <TransactionListComponent
                walletAddress={wallet.publicKey}
                getToken={getToken}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}