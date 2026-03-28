import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type SubscriptionState = {
  active_household_id: string;
  household_name: string;
  plan_tier: string;
  max_profiles: number;
  max_inventory_items: number;
  shopping_lists_per_month: number;
  max_members: number;
  max_active_integrations: number;
};

type RawSubscriptionState = {
  active_household_id?: string | null;
  household_name?: string | null;
  plan_tier?: string | null;
  max_profiles?: number | null;
  max_inventory_items?: number | null;
  shopping_lists_per_month?: number | null;
  max_members?: number | null;
  max_active_integrations?: number | null;
};

type RawQuotaAssert = {
  ok?: boolean | null;
  allowed?: boolean | null;
  limit_name?: string | null;
  requested_value?: number | null;
  current_limit?: number | null;
  limit_value?: number | null;
};

export type QuotaAssertResult = {
  ok: boolean;
  limit_name: string;
  requested_value: number;
  current_limit: number;
};

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function readSubscriptionState(): Promise<SubscriptionState> {
  try {
    const raw = (await callRpc("rpc_subscription_state", {}, { unwrap: true })) as
      | RawSubscriptionState
      | RawSubscriptionState[]
      | null;

    const row = firstRow(raw);

    return {
      active_household_id: row?.active_household_id ?? "",
      household_name: row?.household_name ?? "Foyer DOMYLI",
      plan_tier: row?.plan_tier ?? "FREE",
      max_profiles: toNumber(row?.max_profiles, 0),
      max_inventory_items: toNumber(row?.max_inventory_items, 0),
      shopping_lists_per_month: toNumber(row?.shopping_lists_per_month, 0),
      max_members: toNumber(row?.max_members, 0),
      max_active_integrations: toNumber(row?.max_active_integrations, 0),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function assertQuota(
  limitName: string,
  requestedValue: number,
): Promise<QuotaAssertResult> {
  try {
    const raw = (await callRpc(
      "rpc_quota_assert",
      {
        p_limit_name: limitName,
        p_requested_value: requestedValue,
      },
      { unwrap: true },
    )) as RawQuotaAssert | RawQuotaAssert[] | null;

    const row = firstRow(raw);

    return {
      ok: Boolean(row?.ok ?? row?.allowed),
      limit_name: row?.limit_name ?? limitName,
      requested_value: toNumber(row?.requested_value, requestedValue),
      current_limit: toNumber(row?.current_limit ?? row?.limit_value, 0),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}