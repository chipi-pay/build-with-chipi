"use client";

import { useGetTokenBalance } from "@chipi-stack/nextjs";

interface WalletInfoProps {
  wallet: any;
  formattedBalance: string;
  getToken: () => Promise<string | null>;
}

export default function WalletInfo({
  wallet,
  formattedBalance,
  getToken,
}: WalletInfoProps) {
  const USDC_CONTRACT =
    "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

  const { data: balanceData, isLoading: isLoadingBalance } =
    useGetTokenBalance({
      params: {
        chainToken: "USDC",
        chain: "STARKNET",
        walletPublicKey: wallet?.publicKey || "",
      },
      getBearerToken: getToken,
      queryOptions: {
        enabled: Boolean(wallet?.publicKey),
      },
    });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Address</label>
          <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
            {wallet?.publicKey}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Balance (USDC)
          </label>
          <p className="text-2xl font-bold text-green-600">
            {isLoadingBalance ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${formattedBalance}`
            )}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Wallet Type
          </label>
          <p className="text-sm">{wallet?.walletType || "CHIPI"}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <a
          href={`https://starkscan.co/contract/${wallet?.publicKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
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
    </div>
  );
}