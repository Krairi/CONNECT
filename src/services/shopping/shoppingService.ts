import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

type RpcObject = Record<string, unknown>;

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

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

export type ShoppingPriorityCode = "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL" | string;
export type ShoppingOriginType = "INVENTORY_THRESHOLD" | "MEAL_CONFIRMATION" | "REOPEN_COMPENSATION" | "SYSTEM_RECORD" | string;
export type ShoppingStatus = "OPEN" | "PENDING" | "DONE" | "ARCHIVED" | "CANCELLED" | string;

export type ShoppingItem = {
  shopping_item_id: string | null;
  item_key: string;
  item_code: string;
  item_label: string;
  category_code: string;
  category_label: string;
  unit_code: string;
  requested_qty: number;
  available_qty: number | null;
  target_qty: number | null;
  shopping_status: ShoppingStatus;
  priority_code: ShoppingPriorityCode;
  origin_type: ShoppingOriginType;
  origin_label: string;
  reason_code: string;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  image_url: string | null;
  image_alt: string | null;
  updated_at: string | null;
};

export type ShoppingRebuildResult = {
  projection_status: string;
  open_count: number;
  critical_count: number;
  high_count: number;
  rebuilt_at: string | null;
};

function normalizeShoppingItem(raw: RpcObject): ShoppingItem {
  const shoppingItemId = typeof raw.shopping_item_id === "string" ? raw.shopping_item_id : null;
  const itemCode = typeof raw.item_code === "string" ? raw.item_code : "";
  const originType = typeof raw.origin_type === "string" ? raw.origin_type : "SYSTEM_RECORD";

  return {
    shopping_item_id: shoppingItemId,
    item_key: shoppingItemId ?? `${originType}::${itemCode || "UNKNOWN"}::${String(raw.linked_entity_id ?? "")}`,
    item_code: itemCode,
    item_label: typeof raw.item_label === "string" ? raw.item_label : "Besoin shopping",
    category_code: typeof raw.category_code === "string" ? raw.category_code : "UNCLASSIFIED",
    category_label: typeof raw.category_label === "string" ? raw.category_label : "À classer",
    unit_code: typeof raw.unit_code === "string" ? raw.unit_code : "UNIT",
    requested_qty: Number(raw.requested_qty ?? 0),
    available_qty: raw.available_qty == null ? null : Number(raw.available_qty),
    target_qty: raw.target_qty == null ? null : Number(raw.target_qty),
    shopping_status: (typeof raw.shopping_status === "string" ? raw.shopping_status : "OPEN") as ShoppingStatus,
    priority_code: (typeof raw.priority_code === "string" ? raw.priority_code : "NORMAL") as ShoppingPriorityCode,
    origin_type: originType as ShoppingOriginType,
    origin_label: typeof raw.origin_label === "string" ? raw.origin_label : "Projection système",
    reason_code: typeof raw.reason_code === "string" ? raw.reason_code : "SYSTEM_PROJECTED",
    linked_entity_type: typeof raw.linked_entity_type === "string" ? raw.linked_entity_type : null,
    linked_entity_id: typeof raw.linked_entity_id === "string" ? raw.linked_entity_id : null,
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
    image_alt: typeof raw.image_alt === "string" ? raw.image_alt : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

function normalizeRebuildResult(raw: RpcObject): ShoppingRebuildResult {
  return {
    projection_status: typeof raw.projection_status === "string" ? raw.projection_status : "UNKNOWN",
    open_count: Number(raw.open_count ?? 0),
    critical_count: Number(raw.critical_count ?? 0),
    high_count: Number(raw.high_count ?? 0),
    rebuilt_at: typeof raw.rebuilt_at === "string" ? raw.rebuilt_at : null,
  };
}

export async function listShoppingItems(): Promise<ShoppingItem[]> {
  try {
    const raw = await callRpcFallback<unknown[]>(["rpc_shopping_items_list_v2", "rpc_shopping_items_list_v1"], {}, {
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 800,
    });

    return pickRows(raw)
      .map((row) => normalizeShoppingItem((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.item_key))
      .sort((a, b) => a.item_label.localeCompare(b.item_label, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function rebuildShoppingProjection(): Promise<ShoppingRebuildResult> {
  try {
    const raw = await callRpcFallback<RpcObject | null>(["rpc_shopping_rebuild_v1"], {}, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 800,
    });

    return normalizeRebuildResult((raw ?? {}) as RpcObject);
  } catch (error) {
    throw toDomyliError(error);
  }
}
