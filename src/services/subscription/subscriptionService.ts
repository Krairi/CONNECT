import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

type RpcObject = Record<string, unknown>;

type EntitlementStatus = "OK" | "WATCH" | "LIMIT_REACHED" | "OVER_LIMIT" | string;

export type PlanCode = "FREE" | "PREMIUM" | "FAMILY" | string;

export type PricingEntitlement = {
  code: string;
  label: string;
  limit_value: number;
  limit_mode: string;
  unit: string | null;
};

export type PricingPlan = {
  plan_code: PlanCode;
  plan_label: string;
  monthly_price_eur: number;
  currency: string;
  sort_order: number;
  highlight: boolean;
  short_promise: string;
  entitlements: PricingEntitlement[];
};

export type SubscriptionUsage = {
  members_count: number;
  profiles_count: number;
  inventory_items_count: number;
  shopping_open_count: number;
  tasks_open_count: number;
  meals_count: number;
  active_integrations_count: number;
};

export type SubscriptionEntitlement = {
  code: string;
  label: string;
  limit_value: number;
  used_value: number;
  remaining_value: number | null;
  limit_mode: string;
  status: EntitlementStatus;
  unit: string | null;
};

export type SubscriptionSnapshot = {
  household_id: string | null;
  current_plan_code: PlanCode;
  billing_status: string;
  started_at: string | null;
  renews_at: string | null;
  plan: PricingPlan;
  usage: SubscriptionUsage;
  entitlements: SubscriptionEntitlement[];
  upgrade_suggestion: {
    target_plan_code: PlanCode | null;
    label: string | null;
    reason: string | null;
  };
};

export type SubscriptionChangePreview = {
  current_plan_code: PlanCode;
  target_plan_code: PlanCode;
  change_status: string;
  target_plan: PricingPlan;
  usage: SubscriptionUsage;
  entitlements: SubscriptionEntitlement[];
  delta: {
    code: string;
    label: string;
    current_limit: number | null;
    target_limit: number | null;
    delta: number | null;
    unit: string | null;
  }[];
};

async function callRpcFallback<T>(names: string[], payload: RpcObject, options: RpcObject = {}): Promise<T> {
  let lastError: unknown = null;
  for (const name of names) {
    try {
      return (await callRpc(name, payload, options as never)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : value == null ? fallback : Number(value);
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeArray<T>(value: unknown, mapper: (entry: RpcObject) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => mapper((entry ?? {}) as RpcObject));
}

function normalizePricingEntitlement(raw: RpcObject): PricingEntitlement {
  return {
    code: normalizeString(raw.code),
    label: normalizeString(raw.label, "Entitlement DOMYLI"),
    limit_value: normalizeNumber(raw.limit_value, 0),
    limit_mode: normalizeString(raw.limit_mode, "LIMITED"),
    unit: typeof raw.unit === "string" ? raw.unit : null,
  };
}

function normalizePricingPlan(raw: RpcObject): PricingPlan {
  return {
    plan_code: normalizeString(raw.plan_code, "FREE") as PlanCode,
    plan_label: normalizeString(raw.plan_label, "Free"),
    monthly_price_eur: normalizeNumber(raw.monthly_price_eur, 0),
    currency: normalizeString(raw.currency, "EUR"),
    sort_order: normalizeNumber(raw.sort_order, 999),
    highlight: normalizeBoolean(raw.highlight, false),
    short_promise: normalizeString(raw.short_promise, "Plan DOMYLI"),
    entitlements: normalizeArray(raw.entitlements, normalizePricingEntitlement),
  };
}

function normalizeUsage(raw: RpcObject): SubscriptionUsage {
  return {
    members_count: normalizeNumber(raw.members_count, 0),
    profiles_count: normalizeNumber(raw.profiles_count, 0),
    inventory_items_count: normalizeNumber(raw.inventory_items_count, 0),
    shopping_open_count: normalizeNumber(raw.shopping_open_count, 0),
    tasks_open_count: normalizeNumber(raw.tasks_open_count, 0),
    meals_count: normalizeNumber(raw.meals_count, 0),
    active_integrations_count: normalizeNumber(raw.active_integrations_count, 0),
  };
}

function normalizeSubscriptionEntitlement(raw: RpcObject): SubscriptionEntitlement {
  return {
    code: normalizeString(raw.code),
    label: normalizeString(raw.label, "Entitlement DOMYLI"),
    limit_value: normalizeNumber(raw.limit_value, 0),
    used_value: normalizeNumber(raw.used_value, 0),
    remaining_value: raw.remaining_value == null ? null : normalizeNumber(raw.remaining_value, 0),
    limit_mode: normalizeString(raw.limit_mode, "LIMITED"),
    status: normalizeString(raw.status, "OK"),
    unit: typeof raw.unit === "string" ? raw.unit : null,
  };
}

function normalizeSnapshot(raw: RpcObject): SubscriptionSnapshot {
  const upgrade = (raw.upgrade_suggestion ?? {}) as RpcObject;
  return {
    household_id: typeof raw.household_id === "string" ? raw.household_id : null,
    current_plan_code: normalizeString(raw.current_plan_code, "FREE") as PlanCode,
    billing_status: normalizeString(raw.billing_status, "ACTIVE"),
    started_at: typeof raw.started_at === "string" ? raw.started_at : null,
    renews_at: typeof raw.renews_at === "string" ? raw.renews_at : null,
    plan: normalizePricingPlan((raw.plan ?? {}) as RpcObject),
    usage: normalizeUsage((raw.usage ?? {}) as RpcObject),
    entitlements: normalizeArray(raw.entitlements, normalizeSubscriptionEntitlement),
    upgrade_suggestion: {
      target_plan_code: typeof upgrade.target_plan_code === "string" ? (upgrade.target_plan_code as PlanCode) : null,
      label: typeof upgrade.label === "string" ? upgrade.label : null,
      reason: typeof upgrade.reason === "string" ? upgrade.reason : null,
    },
  };
}

function normalizePreview(raw: RpcObject): SubscriptionChangePreview {
  return {
    current_plan_code: normalizeString(raw.current_plan_code, "FREE") as PlanCode,
    target_plan_code: normalizeString(raw.target_plan_code, "PREMIUM") as PlanCode,
    change_status: normalizeString(raw.change_status, "AVAILABLE"),
    target_plan: normalizePricingPlan((raw.target_plan ?? {}) as RpcObject),
    usage: normalizeUsage((raw.usage ?? {}) as RpcObject),
    entitlements: normalizeArray(raw.entitlements, normalizeSubscriptionEntitlement),
    delta: normalizeArray(raw.delta, (entry) => ({
      code: normalizeString(entry.code),
      label: normalizeString(entry.label, "Entitlement DOMYLI"),
      current_limit: entry.current_limit == null ? null : normalizeNumber(entry.current_limit, 0),
      target_limit: entry.target_limit == null ? null : normalizeNumber(entry.target_limit, 0),
      delta: entry.delta == null ? null : normalizeNumber(entry.delta, 0),
      unit: typeof entry.unit === "string" ? entry.unit : null,
    })),
  };
}

export async function readPricingPlans(): Promise<PricingPlan[]> {
  try {
    const raw = await callRpcFallback<unknown>(["rpc_pricing_public_list_v1"], {}, { unwrap: true, timeoutMs: 12000, retries: 1, retryDelayMs: 700 });
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((entry) => normalizePricingPlan((entry ?? {}) as RpcObject)).sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readSubscriptionSnapshot(): Promise<SubscriptionSnapshot> {
  try {
    const raw = await callRpcFallback<unknown>(["rpc_subscription_snapshot_v1"], {}, { unwrap: true, timeoutMs: 12000, retries: 1, retryDelayMs: 700 });
    return normalizeSnapshot((raw ?? {}) as RpcObject);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readSubscriptionChangePreview(targetPlanCode: string): Promise<SubscriptionChangePreview> {
  try {
    const raw = await callRpcFallback<unknown>(["rpc_subscription_change_preview_v1"], { p_target_plan_code: targetPlanCode }, { unwrap: true, timeoutMs: 12000, retries: 1, retryDelayMs: 700 });
    return normalizePreview((raw ?? {}) as RpcObject);
  } catch (error) {
    throw toDomyliError(error);
  }
}
