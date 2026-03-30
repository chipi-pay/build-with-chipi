"use client";

import { useTransfer } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function TransferWithPasskey() {
  const { getToken } = useAuth();
  const { transferAsync, isLoading } = useTransfer();
  const { authenticate } = usePasskeyAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleTransfer = async () => {
    try {
      // Triggers biometric prompt — returns encryptKey or null if cancelled
      const encryptKey = await authenticate();
      if (!encryptKey) return;

      const walletStr = localStorage.getItem("wallet");
      if (!walletStr) {
        alert("No wallet found");
        return;
      }

      const wallet = JSON.parse(walletStr);

      const bearerToken = await getToken();
      if (!bearerToken) {
        alert("Authentication required");
        return;
      }

      // Transfer with passkey-derived key
      // Do NOT pass usePasskey: true — authenticate() already handled it
      const txHash = await transferAsync({
        params: {
          encryptKey,
          wallet,
          token: "USDC",
          recipient,
          amount: Number(amount),
        },
        bearerToken,
      });

      alert(`Transfer complete: ${txHash}`);
      setRecipient("");
      setAmount("");
    } catch (err: any) {
      console.error("Transfer failed:", err);
      alert(`Error: ${err.message || "Transfer failed"}`);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Send with Passkey</h2>

      <input
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
      />

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        step="0.000001"
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        onClick={handleTransfer}
        disabled={isLoading || !recipient || !amount}
        className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400 font-semibold"
      >
        {isLoading ? "Sending..." : "Send with Passkey"}
      </button>
    </div>
  );
}