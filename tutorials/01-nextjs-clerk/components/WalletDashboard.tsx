"use client";

import { useAuth } from "@clerk/nextjs";
import { useChipiWallet } from "@chipi-stack/nextjs";
import CreateWallet from "./CreateWallet";
import WalletInfo from "./WalletInfo";
import TransferForm from "./TransferForm";
import TransactionList from "./TransactionList";
import MigrateToPasskey from "./MigrateToPasskey";

export default function WalletDashboard() {
  const { userId, getToken } = useAuth();

  const {
    wallet,
    hasWallet,
    formattedBalance,
    createWallet,
    isLoadingWallet,
  } = useChipiWallet({
    externalUserId: userId || "",
    getBearerToken: getToken,
  });

  if (isLoadingWallet) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!hasWallet) {
    return (
      <div className="max-w-2xl mx-auto">
        <CreateWallet
          userId={userId || ""}
          getToken={getToken}
          createWallet={createWallet}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WalletInfo
        wallet={wallet}
        formattedBalance={formattedBalance}
        getToken={getToken}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransferForm wallet={wallet} getToken={getToken} />
        <MigrateToPasskey
          wallet={wallet}
          userId={userId || ""}
          getToken={getToken}
        />
      </div>

      <TransactionList
        walletAddress={wallet?.publicKey || ""}
        getToken={getToken}
      />
    </div>
  );
}