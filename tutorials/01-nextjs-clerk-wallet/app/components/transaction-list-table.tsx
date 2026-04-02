"use client";

import { useState } from "react";
import { useGetTransactionList } from "@chipi-stack/nextjs";

type Props = {
  walletAddress?: string;
  getBearerToken: () => Promise<string | null | undefined>;
};

export function TransactionListTable({ walletAddress, getBearerToken }: Props) {
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useGetTransactionList({
    query: {
      page,
      limit: 10,
      walletAddress: walletAddress || "",
    },
    getBearerToken,
    queryOptions: {
      enabled: Boolean(walletAddress),
    },
  });

  if (!walletAddress) {
    return <div className="p-4 text-zinc-300">Create a wallet to see transactions.</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-zinc-300">Loading transactions...</div>;
  }

  if (isError) {
    return (
      <div className="p-4 text-red-400">
        Error loading transactions:{" "}
        {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  return (
    <div className="vapor-card overflow-x-auto">
      <div className="flex items-center justify-between gap-3">
        <h3 className="vapor-title">Recent Transactions</h3>
        <button
          type="button"
          className="vapor-btn-ghost"
          onClick={() => void refetch()}
          disabled={isLoading || isRefetching}
        >
          {isRefetching ? "Refreshing..." : "Refetch txs"}
        </button>
      </div>
      <table className="mt-3 min-w-full text-left text-sm text-zinc-200">
        <thead>
          <tr className="font-semibold text-cyan-300">
            <th className="px-2 py-2">Hash</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Amount</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data?.data && data.data.length > 0 ? (
            data.data.map((tx) => {
              const hash = tx.transactionHash;
              const createdAt = tx.createdAt ? new Date(tx.createdAt) : null;
              return (
                <tr key={tx.id} className="border-t border-fuchsia-900/50 hover:bg-fuchsia-950/20">
                  <td className="px-2 py-2 font-mono break-all">
                    <a
                      href={`https://starkscan.co/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:underline"
                    >
                      {hash.slice(0, 8)}...{hash.slice(-6)}
                    </a>
                  </td>
                  <td className="px-2 py-2">{tx.type}</td>
                  <td className="px-2 py-2">
                    {tx.amount ?? "-"} {tx.token ?? ""}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={tx.status === "SUCCESS" ? "text-green-300" : "text-red-300"}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {createdAt && !Number.isNaN(createdAt.getTime())
                      ? createdAt.toLocaleString()
                      : "-"}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-2 py-4 text-center text-zinc-400">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-between text-xs">
        <button
          type="button"
          className="vapor-btn-ghost"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="text-zinc-400">Page {data?.page ?? page} / {data?.totalPages ?? "?"}</span>
        <button type="button" className="vapor-btn-ghost" onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}