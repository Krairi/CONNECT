import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type ReadinessReason = string;

export type ReadinessStatus = {
  household_id: string;
  activation_score: number;
  is_operational: boolean;
  go: boolean;
  go_label: "GO" | "NO_GO";
  reasons: ReadinessReason[];
  warnings: ReadinessReason[];
  activation: Record<string, unknown>;
  value_chain: Record<string, unknown>;
  today_health: Record<string, unknown>;
  dashboard: Record<string, unknown>;
  status: Record<string, unknown>;
  subscription: Record<string, unknown>;
  entitlements: Array<Record<string, unknown>>;
  checked_at: string | null;
};

type RawReadinessStatus = Partial<ReadinessStatus>;

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeReadiness(row: RawReadinessStatus | null): ReadinessStatus {
  return {
    household_id: typeof row?.household_id === "string" ? row.household_id : "",
    activation_score:
      typeof row?.activation_score === "number" && Number.isFinite(row.activation_score)
        ? row.activation_score
        : 0,
    is_operational: Boolean(row?.is_operational),
    go: Boolean(row?.go),
    go_label: row?.go_label === "GO" ? "GO" : "NO_GO",
    reasons: Array.isArray(row?.reasons) ? row.reasons.filter((v): v is string => typeof v === "string") : [],
    warnings: Array.isArray(row?.warnings) ? row.warnings.filter((v): v is string => typeof v === "string") : [],
    activation: row?.activation && typeof row.activation === "object" ? row.activation : {},
    value_chain: row?.value_chain && typeof row.value_chain === "object" ? row.value_chain : {},
    today_health: row?.today_health && typeof row.today_health === "object" ? row.today_health : {},
    dashboard: row?.dashboard && typeof row.dashboard === "object" ? row.dashboard : {},
    status: row?.status && typeof row.status === "object" ? row.status : {},
    subscription: row?.subscription && typeof row.subscription === "object" ? row.subscription : {},
    entitlements: Array.isArray(row?.entitlements)
      ? row.entitlements.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
      : [],
    checked_at: typeof row?.checked_at === "string" ? row.checked_at : null,
  };
}

export async function readReadinessStatus(): Promise<ReadinessStatus> {
  try {
    const primary = (await callRpc("rpc_readiness_status_v2", {}, { unwrap: true })) as
      | RawReadinessStatus
      | RawReadinessStatus[]
      | null;
    return normalizeReadiness(firstRow(primary));
  } catch (primaryError) {
    try {
      const fallback = (await callRpc("rpc_readiness_status", {}, { unwrap: true })) as
        | RawReadinessStatus
        | RawReadinessStatus[]
        | null;
      return normalizeReadiness(firstRow(fallback));
    } catch {
      throw toDomyliError(primaryError);
    }
  }
}
