"use client";

import { useAuth } from "@clerk/nextjs";
import { useGetTokenBalance } from "@chipi-stack/nextjs";

interface TokenBalanceProps {
  walletPublicKey: string;
}

const USDC_CONTRACT = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

export default function TokenBalance({ walletPublicKey }: TokenBalanceProps) {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useGetTokenBalance({
    params: {
      chainToken: "USDC",
      chain: "STARKNET",
      walletPublicKey,
    },
    getBearerToken: getToken,
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Token Balance</h2>

      {isLoading && <p className="text-gray-600">Loading balance...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {data && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">USDC Balance</p>
            <p className="text-3xl font-bold text-green-600">
              {data.balance} USDC
            </p>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            <p className="font-medium mb-1">USDC Contract Address:</p>
            <p className="font-mono break-all bg-gray-50 p-2 rounded">
              {USDC_CONTRACT}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}