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

/**
 * Remembers the deposit. Returns false when the browser refused the write
 * (quota, blocked storage) and never throws: it runs inside the SDK's
 * `onStatus`, between the burn and `registerCctpDeposit`, and an exception
 * there would leave a burn unregistered.
 */
export function savePendingDeposit(walletAddress: string, deposit: PendingDeposit): boolean {
  try {
    localStorage.setItem(key(walletAddress), JSON.stringify(deposit));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearPendingDeposit(walletAddress: string): void {
  try {
    localStorage.removeItem(key(walletAddress));
  } catch {
    // Blocked storage: nothing to forget there.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** True when this browser lets the page read and write localStorage. Checked before a deposit starts. */
export function storageReady(): boolean {
  try {
    const probe = "pending-deposit:probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** For useSyncExternalStore: the stored string (same string, same snapshot); null on the server or when storage is blocked. */
export function readPendingDepositRaw(walletAddress: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key(walletAddress));
  } catch {
    return null;
  }
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
