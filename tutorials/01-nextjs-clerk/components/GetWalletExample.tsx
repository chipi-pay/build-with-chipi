"use client";

import { useGetWallet } from "@chipi-stack/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function GetWalletExample() {
  const { userId, getToken } = useAuth();

  const {
    data: wallet,
    isLoading,
    error,
    fetchWallet,
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

  const loadWallet = async () => {
    if (!userId) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");

      const walletData = await fetchWallet({
        params: { externalUserId: userId },
        getBearerToken: async () => token,
      });

      console.log("Wallet loaded:", walletData);
    } catch (error) {
      console.error("Error loading wallet:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Get Wallet Example</h2>

      {isLoading && <p>Loading wallet...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}
      {wallet && (
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Public Key:</span>
            <span className="ml-2 font-mono text-xs break-all">
              {wallet.publicKey}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Normalized Public Key:</span>
            <span className="ml-2 font-mono text-xs break-all">
              {wallet.normalizedPublicKey}
            </span>
          </p>
        </div>
      )}

      <button
        onClick={loadWallet}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Load Wallet Manually
      </button>
    </div>
  );
}