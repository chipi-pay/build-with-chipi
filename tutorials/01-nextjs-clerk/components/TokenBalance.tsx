"use client";

import { useGetTokenBalance } from "@chipi-stack/nextjs";

interface TokenBalanceProps {
  walletPublicKey: string;
  getToken: () => Promise<string | null>;
}

export default function TokenBalanceComponent({
  walletPublicKey,
  getToken,
}: TokenBalanceProps) {
  const { data, isLoading, error } = useGetTokenBalance({
    params: {
      chainToken: "USDC",
      chain: "STARKNET",
      walletPublicKey,
    },
    getBearerToken: getToken,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Token Balance</h2>
        <p className="text-gray-600">Loading balance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Token Balance</h2>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Token Balance Details</h2>
      <div className="space-y-2">
        <p className="text-sm">
          <span className="font-medium">Token:</span>
          <span className="ml-2">USDC</span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Balance:</span>
          <span className="ml-2 text-lg font-bold">{data?.balance || "0"}</span>
        </p>
      </div>
    </div>
  );
}