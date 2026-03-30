"use client";

import { useGetTransactionList } from "@chipi-stack/nextjs";
import { useState } from "react";

interface TransactionListProps {
  walletAddress: string;
  getToken: () => Promise<string | null>;
}

export default function TransactionListComponent({
  walletAddress,
  getToken,
}: TransactionListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetTransactionList({
    query: {
      page,
      limit: 10,
      walletAddress,
    },
    getBearerToken: getToken,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

      {data?.data && data.data.length > 0 ? (
        <>
          <ul className="space-y-3">
            {data.data.map((tx: any) => (
              <li
                key={tx.id}
                className="border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono text-sm break-all text-gray-900">
                      {tx.transactionHash}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {tx.status}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.data || data.data.length < 10}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-600">No transactions found</p>
      )}
    </div>
  );
}