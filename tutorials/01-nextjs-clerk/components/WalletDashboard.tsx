"use client";

import { useAuth } from "@clerk/nextjs";
import { useChipiWallet } from "@chipi-stack/nextjs";
import CreateWallet from "./CreateWallet";
import WalletInfo from "./WalletInfo";
import TokenBalance from "./TokenBalance";
import TransferForm from "./TransferForm";
import TransactionList from "./TransactionList";
import PasskeyMigration from "./PasskeyMigration";

export default function WalletDashboard() {
  const { userId, getToken } = useAuth();

  const { wallet, hasWallet, isLoadingWallet } = useChipiWallet({
    externalUserId: userId || "",
    getBearerToken: getToken,
  });

  if (isLoadingWallet) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-600">Loading wallet...</p>
      </div>
    );
  }

  if (!hasWallet) {
    return <CreateWallet />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletInfo wallet={wallet!} />
        <TokenBalance walletPublicKey={wallet!.publicKey} />
      </div>

      <TransferForm wallet={wallet!} />

      <PasskeyMigration wallet={wallet!} />

      <TransactionList walletAddress={wallet!.publicKey} />
    </div>
  );
}