"use client";

import { useAuth } from "@clerk/nextjs";
import { useGetTransactionStatus } from "@chipi-stack/nextjs";

interface TransactionStatusProps {
  txHash: string;
  onClose: () => void;
}

export default function TransactionStatus({
  txHash,
  onClose,
}: TransactionStatusProps) {
  const { getToken } = useAuth();

  const { data, isLoading } = useGetTransactionStatus({
    hash: txHash,
    getBearerToken: getToken,
    refetchInterval: 3000,
  });

  const confirmed =
    data?.status === "ACCEPTED_ON_L2" || data?.status === "ACCEPTED_ON_L1";

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-800">Transaction Status</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {isLoading && <p className="text-gray-600">Checking status...</p>}

      {data && (
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p
              className={`font-medium ${
                confirmed ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {data.status}
            </p>
          </div>

          {data.blockNumber && (
            <div>
              <p className="text-sm text-gray-600">Block Number</p>
              <p className="font-medium text-gray-800">{data.blockNumber}</p>
            </div>
          )}

          {data.revertReason && (
            <div>
              <p className="text-sm text-gray-600">Revert Reason</p>
              <p className="font-medium text-red-600">{data.revertReason}</p>
            </div>
          )}

          {confirmed && (
            <div className="mt-3 p-2 bg-green-100 text-green-800 rounded text-sm">
              ✓ Transaction confirmed!
            </div>
          )}
        </div>
      )}
    </div>
  );
}