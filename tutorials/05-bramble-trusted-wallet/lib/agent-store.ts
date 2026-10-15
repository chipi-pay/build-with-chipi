import "server-only";
import type { SessionKeyData } from "@chipi-stack/backend";

/**
 * The agent's session, per user (the Bramble address). In memory so the
 * tutorial runs without a database: lost on restart, not shared between
 * serverless instances. Use a table in production. The private key inside
 * SessionKeyData is encrypted with agentSessionSecret().
 */
export interface AgentRecord {
  session: SessionKeyData;
  active: boolean;
}

const memory = globalThis as unknown as { __agents?: Map<string, AgentRecord> };
const agents = (memory.__agents ??= new Map<string, AgentRecord>());

export function getAgent(userId: string): AgentRecord | undefined {
  return agents.get(userId);
}

export function saveAgent(userId: string, record: AgentRecord): void {
  agents.set(userId, record);
}
