"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

/**
 * Optional route for passkey-related notes. Persisted values must be scoped per Clerk user
 * (same pattern as create-wallet-with-passkey): `wallet_${userId}`, `credentialId_${userId}`.
 */
export default function PasskeyPage() {
  const { userId, isSignedIn } = useAuth();

  const hasScopedWallet =
    typeof window !== "undefined" &&
    Boolean(userId && localStorage.getItem(`wallet_${userId}`));

  return (
    <div className="min-h-screen p-6 text-zinc-200">
      <h1 className="text-lg font-semibold text-fuchsia-300">Passkey</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-400">
        Wallet and credential entries in <code className="text-cyan-200">localStorage</code> are keyed
        per signed-in user so switching Clerk accounts does not reuse another user&apos;s cached data.
      </p>
      {isSignedIn && userId ? (
        <p className="mt-3 text-sm">
          Current user has cached wallet entry:{" "}
          <span className="font-mono text-cyan-200">{hasScopedWallet ? "yes" : "no"}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Sign in to inspect scoped storage state.</p>
      )}
      <Link href="/" className="mt-6 inline-block text-cyan-300 underline underline-offset-2">
        Back to dashboard
      </Link>
    </div>
  );
}
