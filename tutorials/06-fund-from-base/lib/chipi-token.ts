"use client";

/**
 * A fresh JWT for Chipi's API, from this app's /api/auth/token. It lasts 15
 * minutes: fetch it right before each Chipi call instead of keeping it.
 */
export async function getChipiToken(): Promise<string | null> {
  const res = await fetch("/api/auth/token");
  if (!res.ok) return null;
  return ((await res.json()) as { token?: string }).token ?? null;
}
