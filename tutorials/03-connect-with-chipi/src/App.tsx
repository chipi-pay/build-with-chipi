import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, type Connector } from "@starknet-react/core";
import "./App.css";

// A minimal SNIP-12 (revision 1) message to prove signTypedData round-trips.
const TYPED_DATA = {
  types: {
    StarknetDomain: [
      { name: "name", type: "shortstring" },
      { name: "version", type: "shortstring" },
      { name: "chainId", type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    Message: [{ name: "message", type: "shortstring" }],
  },
  primaryType: "Message",
  domain: { name: "Chipi Test dApp", version: "1", chainId: "SN_MAIN", revision: "1" },
  message: { message: "Hello from a test dApp" },
};

// USDC on Starknet mainnet: a harmless approve(self, 0) to prove a gasless
// execute round-trips without moving funds.
const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

// Connector icons are either a plain string or a {dark, light} pair
// (starknet-react's built-in ready()/braavos() ship real official SVGs this
// way). Connectors that don't set one (e.g. Cartridge) render a monogram
// instead of a fabricated logo.
function iconSrc(connector: Connector): string | null {
  const icon = connector.icon as string | { dark?: string; light?: string } | undefined;
  if (!icon) return null;
  if (typeof icon === "string") return icon;
  return (prefersDark() ? icon.dark : icon.light) ?? icon.light ?? icon.dark ?? null;
}

function WalletIcon({ connector, size = 40 }: { connector: Connector; size?: number }) {
  const src = iconSrc(connector);
  const style = { width: size, height: size };
  return (
    <div className="wallet-icon" style={style}>
      {src ? <img src={src} alt="" /> : connector.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function App() {
  const { connect, connector: activeConnector, connectors } = useConnect();
  const { address, account, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [log, setLog] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const add = (s: string) => setLog((l) => [s, ...l]);

  useEffect(() => {
    if (status === "connected") setModalOpen(false);
    if (status !== "connecting") setConnectingId(null);
  }, [status]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const onConnect = (c: Connector) => {
    setConnectingId(c.id);
    connect({ connector: c });
  };

  const onCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onSign = async () => {
    if (!account) return;
    try {
      const sig = await account.signMessage(TYPED_DATA as never);
      add(`signTypedData ✓ ${JSON.stringify(sig)}`);
    } catch (e) {
      add(`signTypedData ✗ ${(e as Error).message}`);
    }
  };

  const onExecute = async () => {
    if (!account || !address) return;
    try {
      const res = await account.execute([
        { contractAddress: USDC, entrypoint: "approve", calldata: [address, "0x0", "0x0"] },
      ]);
      add(`execute ✓ ${res.transaction_hash}`);
    } catch (e) {
      add(`execute ✗ ${(e as Error).message}`);
    }
  };

  const connectedConnector = activeConnector ?? connectors[0];

  return (
    <div className="page">
      <div className="card-stack">
        <div className="hero">
          <h1>Connect with Chipi: test dApp</h1>
          <p>
            Proves the round-trip against a local walletv2 (<code>VITE_CHIPI_WALLET_URL</code>), in the
            same connector array as any other standard wallet, no whitelisting.
          </p>
        </div>

        <div className="panel">
          {status !== "connected" ? (
            <button className="connect-trigger" onClick={() => setModalOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="14" rx="3" />
                <path d="M16 12h.01M2 10h20" />
              </svg>
              Connect Wallet
            </button>
          ) : (
            <>
              <div className="account-bar">
                <div className="account-chip">
                  <span className="status-dot" />
                  {connectedConnector && <WalletIcon connector={connectedConnector} />}
                  <button onClick={() => setAccountMenuOpen((v) => !v)}>{address && short(address)}</button>
                </div>
                <div className="action-row" style={{ marginTop: 0 }}>
                  <button className="btn primary" onClick={onSign}>
                    signTypedData
                  </button>
                  <button className="btn" onClick={onExecute}>
                    execute (gasless)
                  </button>
                </div>
              </div>

              {accountMenuOpen && (
                <div className="action-row">
                  <button className="btn ghost" onClick={onCopy}>
                    {copied ? "Copied ✓" : "Copy address"}
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => {
                      disconnect();
                      setAccountMenuOpen(false);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </>
          )}

          <div className="log-console">
            {log.length ? log.join("\n\n") : <span className="empty">no logs yet</span>}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Connect a wallet</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="wallet-list">
              {connectors.map((c) => {
                const isAvailable = c.available();
                const isConnecting = connectingId === c.id;
                return (
                  <button
                    key={c.id}
                    className="wallet-row"
                    disabled={!isAvailable || isConnecting}
                    onClick={() => onConnect(c)}
                    title={isAvailable ? undefined : `${c.name} isn't installed in this browser`}
                  >
                    <WalletIcon connector={c} />
                    <div className="wallet-meta">
                      <span className="wallet-name">{c.name}</span>
                      <span className={`wallet-status ${isAvailable ? "ok" : ""}`}>
                        {isConnecting ? "Connecting…" : isAvailable ? "Detected" : "Not installed"}
                      </span>
                    </div>
                    {isConnecting && <span className="wallet-spinner" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
