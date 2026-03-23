"use client";

import { useAuth } from "@clerk/nextjs";
import { useGetWallet } from "@chipi-stack/nextjs";

interface WalletInfoProps {
  wallet: {
    publicKey: string;
    encryptedPrivateKey: string;
    walletType: string;
  };
}

export default function WalletInfo({ wallet }: WalletInfoProps) {
  const { userId, getToken } = useAuth();

  const {
    data: walletData,
    isLoading,
    error,
  } = useGetWallet({
    params: {
      externalUserId: userId || "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: {
      enabled: Boolean(userId),
    },
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Wallet Information
      </h2>

      {isLoading && <p className="text-gray-600">Loading wallet...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {walletData && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Public Key</p>
            <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded mt-1">
              {walletData.publicKey}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Normalized Public Key
            </p>
            <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded mt-1">
              {walletData.normalizedPublicKey}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Wallet Type</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {walletData.walletType}
            </p>
          </div>

          <a
            href={`https://starkscan.co/contract/${walletData.publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-600 hover:text-green-800 text-sm font-medium mt-2"
          >
            View on Starkscan
            <svg
              className="w-4 h-4 ml-1"
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
      )}
    </div>
  );
}