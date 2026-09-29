import "server-only";
import type { SessionKeyData } from "@chipi-stack/backend";

/**
 * Where the agent's session lives, per user.
 *
 * In memory so the tutorial runs with no database. It is lost on restart and
 * not shared between serverless instances: use a table in production
 * (user id → SessionKeyData, active flag). The session private key inside
 * SessionKeyData is encrypted with AGENT_SESSION_SECRET.
 */
export interface AgentRecord {
  session: SessionKeyData;
  active: boolean;
  decisions: Array<{ at: string; action: string; reason: string; txHash?: string; success?: boolean }>;
}

const globalStore = globalThis as unknown as { __agents?: Map<string, AgentRecord> };
const agents = (globalStore.__agents ??= new Map<string, AgentRecord>());

export function getAgent(userId: string): AgentRecord | undefined {
  return agents.get(userId);
}

export function saveAgent(userId: string, record: AgentRecord): void {
  agents.set(userId, record);
}
