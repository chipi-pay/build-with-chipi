"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useGetTransactionList } from "@chipi-stack/nextjs";
import TransactionStatus from "./TransactionStatus";

interface TransactionListProps {
  walletAddress: string;
}

export default function TransactionList({
  walletAddress,
}: TransactionListProps) {
  const { getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);

  const { data, isLoading, error } = useGetTransactionList({
    query: {
      page,
      limit: 10,
      walletAddress,
    },
    getBearerToken: getToken,
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>

      {isLoading && <p className="text-gray-600">Loading transactions...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {data && (
        <>
          <div className="space-y-2">
            {data.items.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No transactions yet
              </p>
            )}
            {data.items.map((tx: any) => (
              <div
                key={tx.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTxHash(tx.transactionHash)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs font-mono break-all text-gray-600">
                      {tx.transactionHash}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: <span className="font-medium">{tx.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.items.length < 10}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {selectedTxHash && (
            <div className="mt-6 pt-6 border-t">
              <TransactionStatus
                txHash={selectedTxHash}
                onClose={() => setSelectedTxHash(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}