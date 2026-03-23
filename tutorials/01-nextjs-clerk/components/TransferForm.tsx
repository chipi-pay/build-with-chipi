"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTransfer } from "@chipi-stack/nextjs";
import type { ChainToken } from "@chipi-stack/nextjs";

interface TransferFormProps {
  wallet: {
    publicKey: string;
    encryptedPrivateKey: string;
  };
}

export default function TransferForm({ wallet }: TransferFormProps) {
  const { getToken } = useAuth();
  const { transferAsync, data, isLoading, isError, error } = useTransfer();
  const [form, setForm] = useState({ pin: "", recipient: "", amount: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bearerToken = await getToken();
    if (!bearerToken) {
      console.error("No bearer token available");
      return;
    }

    try {
      await transferAsync({
        params: {
          amount: Number(form.amount),
          encryptKey: form.pin,
          wallet,
          token: "USDC" as ChainToken,
          recipient: form.recipient,
        },
        bearerToken,
      });
      alert("Transfer completed successfully!");
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
          <label className="block text-sm font-medium mb-1">Security PIN</label>
          <input
            type="password"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
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
            className="w-full p-2 border rounded-md font-mono text-sm"
            placeholder="0x..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.000001"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? "Processing..." : "Transfer"}
        </button>
      </form>

      {data && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm font-medium text-green-800 mb-1">
            Transaction Hash:
          </p>
          <p className="text-xs font-mono break-all text-green-700">{data}</p>
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