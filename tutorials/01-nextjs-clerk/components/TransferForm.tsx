"use client";

import { useState } from "react";
import { useTransfer } from "@chipi-stack/nextjs";

interface TransferFormProps {
  wallet: any;
  getToken: () => Promise<string | null>;
}

export default function TransferForm({ wallet, getToken }: TransferFormProps) {
  const [form, setForm] = useState({
    pin: "",
    recipient: "",
    amount: "",
  });

  const { transferAsync, data, isLoading, isError, error } = useTransfer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bearerToken = await getToken();
    if (!bearerToken) {
      console.error("No bearer token available");
      return;
    }

    try {
      const txHash = await transferAsync({
        params: {
          amount: Number(form.amount),
          encryptKey: form.pin,
          wallet: {
            publicKey: wallet.publicKey,
            encryptedPrivateKey: wallet.encryptedPrivateKey,
          },
          token: "USDC",
          recipient: form.recipient,
        },
        bearerToken,
      });

      alert(`Transfer complete! TX Hash: ${txHash}`);
      setForm({ pin: "", recipient: "", amount: "" });
    } catch (err) {
      console.error("Transfer failed:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Transfer Tokens</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Security PIN
          </label>
          <input
            type="password"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            placeholder="Enter your PIN"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            required
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (USDC)
          </label>
          <input
            type="number"
            step="0.000001"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            placeholder="0.00"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
        >
          {isLoading ? "Processing..." : "Transfer"}
        </button>
      </form>

      {data && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium mb-1">Transaction Hash:</p>
          <p className="text-sm font-mono break-all">{data}</p>
          <a
            href={`https://starkscan.co/tx/${data}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 text-sm mt-2 inline-flex items-center gap-1"
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
      )}

      {isError && error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}