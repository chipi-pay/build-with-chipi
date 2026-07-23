import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";

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

// USDC on Starknet mainnet — a harmless approve(self, 0) to prove a gasless
// execute round-trips without moving funds.
const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";

export function App() {
  const { connect, connectors } = useConnect();
  const { address, account, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [log, setLog] = useState<string[]>([]);

  const add = (s: string) => setLog((l) => [`${s}`, ...l]);

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

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h1>Connect with Chipi — test dApp</h1>
      <p style={{ color: "#555" }}>
        Proves the round-trip against a local walletv2 (<code>VITE_CHIPI_WALLET_URL</code>).
      </p>

      {status !== "connected" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {connectors.map((c) => {
            const isAvailable = c.available();
            return (
              <button
                key={c.id}
                disabled={!isAvailable}
                onClick={() => connect({ connector: c })}
                style={{ ...btn, opacity: isAvailable ? 1 : 0.45, cursor: isAvailable ? "pointer" : "not-allowed" }}
                title={isAvailable ? undefined : `${c.name} isn't installed in this browser`}
              >
                {isAvailable ? `Connect with ${c.name}` : `${c.name} (not installed)`}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <p>
            <b>Connected:</b> <code>{address}</code>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onSign} style={btn}>
              signTypedData
            </button>
            <button onClick={onExecute} style={btn}>
              execute (gasless approve 0)
            </button>
            <button onClick={() => disconnect()} style={{ ...btn, background: "#eee", color: "#111" }}>
              Disconnect
            </button>
          </div>
        </div>
      )}

      <pre
        style={{
          marginTop: 20,
          background: "#0A172D",
          color: "#9fe",
          padding: 12,
          borderRadius: 8,
          minHeight: 120,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {log.join("\n\n") || "— logs —"}
      </pre>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "2px solid #0A172D",
  background: "#0A172D",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
