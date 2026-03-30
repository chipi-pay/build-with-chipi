"use client";

import { useGetTransactionStatus } from "@chipi-stack/nextjs";

interface TransactionStatusProps {
  txHash: string;
  getBearerToken: () => Promise<string | null>;
}

export default function TransactionStatus({
  txHash,
  getBearerToken,
}: TransactionStatusProps) {
  const { data, isLoading } = useGetTransactionStatus({
    hash: txHash,
    getBearerToken,
    refetchInterval: 3000,
  });

  if (isLoading) return <p className="text-sm text-gray-600">Checking status...</p>;

  const confirmed =
    data?.status === "ACCEPTED_ON_L2" || data?.status === "ACCEPTED_ON_L1";

  return (
    <div className="text-sm space-y-1">
      <p>
        <span className="font-medium">Status:</span> {data?.status}
      </p>
      {data?.blockNumber && (
        <p>
          <span className="font-medium">Block:</span> {data.blockNumber}
        </p>
      )}
      {data?.revertReason && (
        <p className="text-red-600">
          <span className="font-medium">Revert reason:</span> {data.revertReason}
        </p>
      )}
      {confirmed && <p className="text-green-600 font-semibold">Transaction confirmed!</p>}
    </div>
  );
}