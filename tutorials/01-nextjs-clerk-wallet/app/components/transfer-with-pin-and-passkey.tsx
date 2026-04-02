import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  ChainToken,
  type GetWalletResponse,
  useGetTransactionStatus,
  useTransfer,
} from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { toast } from "sonner";

type Props = {
  wallet: GetWalletResponse;
};

type TxStatus =
  | "RECEIVED"
  | "PENDING"
  | "ACCEPTED_ON_L2"
  | "ACCEPTED_ON_L1"
  | "REJECTED"
  | "REVERTED"
  | "NOT_RECEIVED";

const terminalStatuses = new Set<TxStatus>([
  "ACCEPTED_ON_L1",
  "ACCEPTED_ON_L2",
  "REJECTED",
  "REVERTED",
]);

function isValidTransferInput(recipient: string, amount: string): boolean {
  const trimmed = recipient.trim();
  const n = Number(amount);
  return Boolean(trimmed) && Number.isFinite(n) && n > 0;
}

export function TransferWithPinAndPasskey({ wallet }: Props) {
  const { getToken } = useAuth();
  const { transferAsync, isLoading, isError, error } = useTransfer();
  const { authenticate } = usePasskeyAuth();
  const [pin, setPin] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const statusToastIdRef = useRef<string | number | null>(null);
  const lastStatusRef = useRef<TxStatus | null>(null);

  const { data: txStatus } = useGetTransactionStatus({
    hash: txHash ?? undefined,
    getBearerToken: getToken,
    refetchInterval: txHash ? 3000 : false,
    queryOptions: {
      enabled: Boolean(txHash),
    },
  });

  useEffect(() => {
    const status = txStatus?.status as TxStatus | undefined;
    if (!status || status === lastStatusRef.current) return;
    lastStatusRef.current = status;

    const revertReason = txStatus?.revertReason;
    const message =
      status === "REVERTED" && revertReason
        ? `Transaction reverted: ${revertReason}`
        : `Transaction status: ${status}`;

    if (!terminalStatuses.has(status)) {
      if (!statusToastIdRef.current) {
        const id = toast.loading(message);
        statusToastIdRef.current = id;
      } else {
        toast.loading(message, { id: statusToastIdRef.current });
      }
      return;
    }

    if (status === "ACCEPTED_ON_L1" || status === "ACCEPTED_ON_L2") {
      toast.success(message, { id: statusToastIdRef.current ?? undefined });
    } else {
      toast.error(message, { id: statusToastIdRef.current ?? undefined });
    }
    statusToastIdRef.current = null;
  }, [txStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTransferInput(recipient, amount)) {
      toast.error("Please enter a valid recipient and amount");
      return;
    }
    const bearerToken = await getToken();
    if (!bearerToken) {
      toast.error("No bearer token available");
      return;
    }

    try {
      const hash = await transferAsync({
        params: {
          amount: Number(amount),
          encryptKey: pin,
          wallet,
          token: ChainToken.USDC,
          recipient,
        },
        bearerToken,
      });

      setTxHash(hash);
      toast.message(`Transfer submitted: ${hash.slice(0, 12)}...`);
    } catch (err) {
      toast.error(`Transfer failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePasskeyTransfer = async () => {
    if (!isValidTransferInput(recipient, amount)) {
      toast.error("Please enter a valid recipient and amount");
      return;
    }
    const bearerToken = await getToken();
    if (!bearerToken) {
      toast.error("No bearer token available");
      return;
    }

    try {
      const encryptKey = await authenticate();
      if (!encryptKey) {
        toast.error("Passkey authentication cancelled");
        return;
      }

      const hash = await transferAsync({
        params: {
          amount: Number(amount),
          encryptKey,
          wallet,
          token: ChainToken.USDC,
          recipient,
        },
        bearerToken,
      });

      setTxHash(hash);
      toast.message(`Passkey transfer submitted: ${hash.slice(0, 12)}...`);
    } catch (err) {
      toast.error(`Passkey transfer failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="vapor-card">
      <h2 className="vapor-title">Transfer USDC (PIN)</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="vapor-label">PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="vapor-input"
            required
          />
        </div>

        <div>
          <label className="vapor-label">Recipient address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="vapor-input"
            required
          />
        </div>

        <div>
          <label className="vapor-label">Amount (USDC)</label>
          <input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="vapor-input"
            required
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isLoading} className="vapor-btn-primary disabled:opacity-60">
            {isLoading ? "Processing..." : "Transfer with PIN"}
          </button>
          <button
            type="button"
            onClick={() => void handlePasskeyTransfer()}
            disabled={isLoading}
            className="vapor-btn-primary disabled:opacity-60"
          >
            {isLoading ? "Processing..." : "Transfer with Passkey"}
          </button>
        </div>
      </form>

      {txHash && (
        <p className="mt-4 text-sm font-mono text-cyan-200 break-all">Latest tx: {txHash}</p>
      )}
      {isError && error && <p className="mt-2 text-red-300">Error: {error.message}</p>}
    </div>
  );
}
