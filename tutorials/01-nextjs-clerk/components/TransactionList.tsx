"use client";

import { useState } from "react";
import { useGetTransactionList, useGetTransactionStatus } from "@chipi-stack/nextjs";

interface TransactionListProps {
  walletAddress: string;
  getToken: () => Promise<string | null>;
}

export default function TransactionList({
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
    queryOptions: {
      enabled: Boolean(walletAddress),
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

      {data?.items && data.items.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.items.map((tx: any) => (
              <TransactionItem
                key={tx.id}
                tx={tx}
                getToken={getToken}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.items || data.items.length < 10}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-600 text-center py-8">No transactions yet</p>
      )}
    </div>
  );
}

function TransactionItem({ tx, getToken }: { tx: any; getToken: () => Promise<string | null> }) {
  const { data: statusData } = useGetTransactionStatus({
    hash: tx.transactionHash,
    getBearerToken: getToken,
    refetchInterval: tx.status === "PENDING" ? 3000 : false,
  });

  const displayStatus = statusData?.status || tx.status;

  return (
    <div className="border rounded-md p-3 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono break-all text-gray-900">
            {tx.transactionHash}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(tx.createdAt || Date.now()).toLocaleString()}
          </p>
        </div>
        <span
          className={`ml-3 px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
            displayStatus === "ACCEPTED_ON_L2" || displayStatus === "ACCEPTED_ON_L1"
              ? "bg-green-100 text-green-800"
              : displayStatus === "REJECTED" || displayStatus === "REVERTED"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {displayStatus}
        </span>
      </div>
      <a
        href={`https://starkscan.co/tx/${tx.transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-800 text-xs mt-2 inline-flex items-center gap-1"
      >
        View on Starkscan
        <svg
          className="w-3 h-3"
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
  );
}