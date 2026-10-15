"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildExecuteAddOwnerCall,
  buildExecuteAddVerifierClassCall,
  buildProposeAddOwnerCall,
  buildProposeAddVerifierClassCall,
  isShhhVerifierDeclared,
  parseOpProposedEvents,
  readShhhOwners,
  readVerifierClass,
  resolveStarkSnip12Signer,
  secondsUntilExecutable,
  starkSnip12ApprovalTypedData,
  starkSnip12OwnerCommitment,
  waitForTransaction,
  type NewOwnerInput,
  type ShhhProposedOp,
} from "@chipi-stack/backend";
import { useCallAnyContract, type ChipiWalletData } from "@chipi-stack/nextjs";
import { brambleErrorMessage, deploymentData, requireBrambleAccount, signTypedData, type Bramble } from "@/lib/bramble";
import { getChipiToken } from "@/lib/chipi-token";
import { BRAMBLE_LABEL } from "@/lib/config";
import { provider } from "@/lib/starknet";

/** Bramble's place in the Chipi wallet's owner set: what it signs with. */
export interface BrambleOwner {
  ownerId: number;
  starkPubkey: string;
}

/** What survives the 48-hour wait, in this browser. */
interface Saved {
  brambleAddress: string;
  starkPubkey: string;
  pubkeyFelts: string[];
  proposeTxHash?: string;
}

const KIND = "STARK_SNIP12";

/** The passkey is owner 0: every passkey-signed call from the SDK signs as owner 0. */
const PASSKEY_OWNER = 0;

const hex = (value: bigint) => `0x${value.toString(16)}`;

/**
 * Role OWNER: Bramble can then approve anything the passkey can. For a
 * recovery-only backup, use role "GUARDIAN" (see the README, step 7).
 */
function brambleAsOwner(pubkeyFelts: string[]): NewOwnerInput {
  return { kind: KIND, pubkeyBytes: pubkeyFelts.map((felt) => BigInt(felt)), role: "OWNER", weight: 1, label: BRAMBLE_LABEL };
}

function storageKey(walletAddress: string) {
  return `bramble-owner:${walletAddress}`;
}

function load(walletAddress: string): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(walletAddress));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function store(walletAddress: string, saved: Saved) {
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(saved));
}

function randomFelt(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(31)); // < 2^248: always a felt
  return BigInt(`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`);
}

function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m ${seconds % 60}s`;
}

interface OnChain {
  saved: Saved | null;
  declared: boolean;
  ops: ShhhProposedOp[];
  owner: BrambleOwner | null;
}

export function AddBrambleOwner({
  bramble,
  userId,
  wallet,
  onOwner,
}: {
  bramble: Bramble;
  /** The signed-in Bramble address. */
  userId: string;
  wallet: ChipiWalletData;
  onOwner: (owner: BrambleOwner) => void;
}) {
  const walletAddress = wallet.publicKey;
  const { callAnyContractAsync } = useCallAnyContract();
  const [state, setState] = useState<OnChain | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Everything from the chain, plus what this browser saved. */
  const read = useCallback(async (): Promise<OnChain> => {
    const saved = load(walletAddress);
    const [declared, owners] = await Promise.all([
      isShhhVerifierDeclared(provider, KIND),
      readShhhOwners(provider, walletAddress),
    ]);
    let owner: BrambleOwner | null = null;
    if (saved) {
      const commitment = starkSnip12OwnerCommitment(saved.starkPubkey, saved.brambleAddress);
      const record = owners.find((o) => o.kind === KIND && !o.revoked && o.pubkeyHash === commitment);
      if (record) owner = { ownerId: record.ownerId, starkPubkey: saved.starkPubkey };
    }
    let ops: ShhhProposedOp[] = [];
    if (saved?.proposeTxHash && !owner) {
      // Op ids include the block time: read them back from the propose receipt.
      ops = parseOpProposedEvents((await waitForTransaction(saved.proposeTxHash)).events, walletAddress);
    }
    return { saved, declared, ops, owner };
  }, [walletAddress]);

  const apply = useCallback(
    (next: OnChain) => {
      setState(next);
      if (next.owner) onOwner(next.owner);
    },
    [onOwner]
  );

  useEffect(() => {
    let cancelled = false;
    read()
      .then((next) => {
        if (!cancelled) apply(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [read, apply]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      apply(await read());
    } catch (err) {
      setStatus(null);
      setError(brambleErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // (a) Which key signs for Bramble? One Approval signature tells us.
  const readKey = () =>
    run(async () => {
      await requireBrambleAccount(bramble, userId);
      const messageHash = randomFelt(); // any fresh value: this signature only identifies the key
      const signature = await signTypedData(bramble, starkSnip12ApprovalTypedData({ walletAddress, messageHash }));
      const { starkPubkey, pubkeyFelts } = await resolveStarkSnip12Signer({
        provider,
        signerAddress: userId,
        walletAddress,
        messageHash,
        signature,
        // A new Bramble account carries its key in its deployment data.
        deploymentData: await deploymentData(bramble),
      });
      store(walletAddress, { brambleAddress: userId, starkPubkey: hex(starkPubkey), pubkeyFelts: pubkeyFelts.map(hex) });
      setStatus("Bramble's key is confirmed.");
    });

  // (b) One passkey prompt proposes the verifier class (if missing) and the owner.
  const propose = (saved: Saved) =>
    run(async () => {
      const calls = [];
      if ((await readVerifierClass(provider, walletAddress, KIND)) === 0n) {
        calls.push(buildProposeAddVerifierClassCall({ walletAddress, proposer: PASSKEY_OWNER, kind: KIND }));
      }
      calls.push(buildProposeAddOwnerCall({ walletAddress, proposer: PASSKEY_OWNER, newOwner: brambleAsOwner(saved.pubkeyFelts) }));

      const bearerToken = await getChipiToken();
      if (!bearerToken) throw new Error("Your session expired. Sign in again.");
      setStatus("Confirm with your passkey…");
      const txHash = await callAnyContractAsync({
        params: {
          usePasskey: true,
          externalUserId: userId,
          credentialId: wallet.credentialId ?? undefined,
          wallet,
          contractAddress: walletAddress,
          calls,
        },
        bearerToken,
      });
      setStatus("Proposed. Waiting for Starknet…");
      const receipt = await waitForTransaction(txHash);
      if (!receipt.success) throw new Error(`The proposal reverted: ${receipt.revertReason ?? "unknown reason"}`);
      if (!parseOpProposedEvents(receipt.events, walletAddress).some((op) => op.opKind === "ADD_OWNER")) {
        throw new Error("The wallet recorded no ADD_OWNER proposal.");
      }
      store(walletAddress, { ...saved, proposeTxHash: txHash });
      setStatus("Proposed. Come back in 48 hours.");
    });

  // (c) After 48 hours: register the verifier first, then the owner (it is checked through the verifier).
  const execute = (saved: Saved, ops: ShhhProposedOp[]) =>
    run(async () => {
      const addVerifier = ops.find((op) => op.opKind === "ADD_VERIFIER");
      const addOwner = ops.find((op) => op.opKind === "ADD_OWNER");
      if (!addOwner) throw new Error("No ADD_OWNER proposal found.");
      const calls = [];
      // Execute calls are permissionless: someone may have run this one already.
      if (addVerifier && (await readVerifierClass(provider, walletAddress, KIND)) === 0n) {
        calls.push(buildExecuteAddVerifierClassCall({ walletAddress, opId: addVerifier.opId, kind: KIND }));
      }
      calls.push(buildExecuteAddOwnerCall({ walletAddress, opId: addOwner.opId, newOwner: brambleAsOwner(saved.pubkeyFelts) }));

      const bearerToken = await getChipiToken();
      if (!bearerToken) throw new Error("Your session expired. Sign in again.");
      setStatus("Confirm with your passkey…");
      const txHash = await callAnyContractAsync({
        params: {
          usePasskey: true,
          externalUserId: userId,
          credentialId: wallet.credentialId ?? undefined,
          wallet,
          contractAddress: walletAddress,
          calls,
        },
        bearerToken,
      });
      setStatus("Sent. Waiting for Starknet…");
      const receipt = await waitForTransaction(txHash);
      if (!receipt.success) throw new Error(`The execution reverted: ${receipt.revertReason ?? "unknown reason"}`);
      setStatus("Bramble is a co-owner.");
    });

  if (!state) return <p className="text-sm text-zinc-400">{error ?? "Reading the wallet's owners…"}</p>;
  if (state.owner) {
    return <p className="text-sm text-green-400">Bramble is co-owner #{state.owner.ownerId} of this wallet.</p>;
  }

  const { saved, declared, ops } = state;
  const validAfter = ops.length ? Math.max(...ops.map((op) => op.validAfter)) : 0;
  const expiresAt = ops.length ? Math.min(...ops.map((op) => op.expiresAt)) : 0;
  const waitSeconds = ops.length ? secondsUntilExecutable(validAfter, now) : 0;

  return (
    <div className="flex flex-col gap-3">
      {!declared && (
        <p className="rounded border border-amber-600 p-2 text-sm text-amber-300">
          The STARK_SNIP12 verifier class is not declared on Starknet mainnet yet. Steps (b) and (c) work once it is;
          until then, proposing it would register a signer kind that can never verify.
        </p>
      )}

      {!saved ? (
        <button onClick={readKey} disabled={busy} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
          {busy ? "Waiting for Bramble…" : "(a) Confirm Bramble's key"}
        </button>
      ) : !saved.proposeTxHash ? (
        <button
          onClick={() => propose(saved)}
          disabled={busy || !declared}
          className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
        >
          {busy ? "Waiting…" : "(b) Propose Bramble as co-owner (passkey)"}
        </button>
      ) : ops.length > 0 && now >= expiresAt ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>The proposal expired {new Date(expiresAt * 1000).toLocaleString()} without being executed.</p>
          <button
            onClick={() =>
              run(async () => {
                // Forget the expired proposal; Bramble's confirmed key stays.
                store(walletAddress, { brambleAddress: saved.brambleAddress, starkPubkey: saved.starkPubkey, pubkeyFelts: saved.pubkeyFelts });
              })
            }
            disabled={busy}
            className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
          >
            Propose again
          </button>
        </div>
      ) : waitSeconds > 0 ? (
        <p className="text-sm">
          Timelock: {duration(waitSeconds)} left. Any owner can cancel the proposal until it is executed. It expires{" "}
          {new Date(expiresAt * 1000).toLocaleString()}.
        </p>
      ) : (
        <button
          onClick={() => execute(saved, ops)}
          disabled={busy || !declared || ops.length === 0}
          className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
        >
          {busy ? "Waiting…" : "(c) Add Bramble as co-owner (passkey)"}
        </button>
      )}

      {status && <p className="text-sm text-zinc-300">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
