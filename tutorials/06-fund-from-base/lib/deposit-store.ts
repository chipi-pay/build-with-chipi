/**
 * A deposit in flight, remembered per Chipi wallet in localStorage. Once the
 * burn is registered with Chipi, the mint happens with or without this page;
 * the burn hash is all that is needed to follow it (useCctpDepositStatus).
 *
 * In production keep it on your server too: localStorage is one browser.
 */
export interface PendingDeposit {
  burnTxHash: string;
  /** Human USDC, as quoted. */
  amountUsdc: string;
  /** Unix ms when the burn was sent. */
  startedAt: number;
}

const EVENT = "tutorial:pending-deposit";

function key(walletAddress: string): string {
  return `pending-deposit:${walletAddress.toLowerCase()}`;
}

export function savePendingDeposit(walletAddress: string, deposit: PendingDeposit): void {
  localStorage.setItem(key(walletAddress), JSON.stringify(deposit));
  window.dispatchEvent(new Event(EVENT));
}

export function clearPendingDeposit(walletAddress: string): void {
  localStorage.removeItem(key(walletAddress));
  window.dispatchEvent(new Event(EVENT));
}

/** For useSyncExternalStore: the stored string (same string, same snapshot), null on the server. */
export function readPendingDepositRaw(walletAddress: string): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(key(walletAddress));
}

export function parsePendingDeposit(raw: string | null): PendingDeposit | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PendingDeposit>;
    if (typeof value.burnTxHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value.burnTxHash)) return null;
    if (typeof value.amountUsdc !== "string" || typeof value.startedAt !== "number") return null;
    return { burnTxHash: value.burnTxHash, amountUsdc: value.amountUsdc, startedAt: value.startedAt };
  } catch {
    return null;
  }
}

/** Re-render on a save or clear from this tab, or a change from another tab. */
export function subscribePendingDeposit(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
