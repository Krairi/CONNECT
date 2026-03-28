import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type ReadinessStatus = {
  household_id: string;
  activation_score: number;
  is_operational: boolean;
  go: boolean;
  go_label: "GO" | "NO_GO";
  reasons: string[];
  activation: Record<string, unknown>;
  value_chain: Record<string, unknown>;
  today_health: Record<string, unknown>;
  checked_at: string | null;
};

type RawReadinessStatus = {
  household_id?: string | null;
  activation_score?: number | null;
  is_operational?: boolean | null;
  go?: boolean | null;
  go_label?: string | null;
  reasons?: string[] | null;
  activation?: Record<string, unknown> | null;
  value_chain?: Record<string, unknown> | null;
  today_health?: Record<string, unknown> | null;
  checked_at?: string | null;
};

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function readReadinessStatus(): Promise<ReadinessStatus> {
  try {
    const raw = (await callRpc(
      "rpc_readiness_status",
      {},
      { unwrap: true },
    )) as RawReadinessStatus | RawReadinessStatus[] | null;

    const row = firstRow(raw);

    return {
      household_id: row?.household_id ?? "",
      activation_score: typeof row?.activation_score === "number" ? row.activation_score : 0,
      is_operational: Boolean(row?.is_operational),
      go: Boolean(row?.go),
      go_label: row?.go_label === "GO" ? "GO" : "NO_GO",
      reasons: Array.isArray(row?.reasons) ? row.reasons : [],
      activation: row?.activation ?? {},
      value_chain: row?.value_chain ?? {},
      today_health: row?.today_health ?? {},
      checked_at: row?.checked_at ?? null,
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}