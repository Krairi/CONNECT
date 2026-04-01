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

export type InventoryCatalogItem = {
  item_code: string;
  item_label: string;
  category_code: string;
  category_label: string;
  unit_code: string;
  image_url: string | null;
  image_alt: string | null;
  usage_scope: string | null;
  sort_order: number;
};

export type InventoryItem = {
  inventory_item_id: string;
  item_code: string;
  item_label: string;
  category_code: string;
  category_label: string;
  unit_code: string;
  qty_on_hand: number;
  min_qty: number;
  stock_status: "OUT" | "LOW" | "HEALTHY" | string;
  coverage_ratio: number | null;
  image_url: string | null;
  image_alt: string | null;
  updated_at: string | null;
};

export type InventoryUpsertPayload = {
  p_item_code: string;
  p_qty_on_hand: number;
  p_min_qty: number;
};

export type InventoryUpsertResult = InventoryItem;

function normalizeCatalogItem(raw: RpcObject): InventoryCatalogItem {
  return {
    item_code: typeof raw.item_code === "string" ? raw.item_code : "",
    item_label: typeof raw.item_label === "string" ? raw.item_label : "Article",
    category_code: typeof raw.category_code === "string" ? raw.category_code : "UNCLASSIFIED",
    category_label: typeof raw.category_label === "string" ? raw.category_label : "À classer",
    unit_code: typeof raw.unit_code === "string" ? raw.unit_code : "UNIT",
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
    image_alt: typeof raw.image_alt === "string" ? raw.image_alt : null,
    usage_scope: typeof raw.usage_scope === "string" ? raw.usage_scope : null,
    sort_order: Number(raw.sort_order ?? 0),
  };
}

function normalizeInventoryItem(raw: RpcObject): InventoryItem {
  return {
    inventory_item_id: typeof raw.inventory_item_id === "string" ? raw.inventory_item_id : "",
    item_code: typeof raw.item_code === "string" ? raw.item_code : "",
    item_label: typeof raw.item_label === "string" ? raw.item_label : "Article stock",
    category_code: typeof raw.category_code === "string" ? raw.category_code : "UNCLASSIFIED",
    category_label: typeof raw.category_label === "string" ? raw.category_label : "À classer",
    unit_code: typeof raw.unit_code === "string" ? raw.unit_code : "UNIT",
    qty_on_hand: Number(raw.qty_on_hand ?? 0),
    min_qty: Number(raw.min_qty ?? 0),
    stock_status: (typeof raw.stock_status === "string" ? raw.stock_status : "HEALTHY") as InventoryItem["stock_status"],
    coverage_ratio: raw.coverage_ratio == null ? null : Number(raw.coverage_ratio),
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
    image_alt: typeof raw.image_alt === "string" ? raw.image_alt : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

export async function listInventoryCatalog(): Promise<InventoryCatalogItem[]> {
  try {
    const raw = await callRpcFallback<unknown[]>(["rpc_inventory_catalog_list_v1"], {}, {
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 800,
    });

    return pickRows(raw)
      .map((row) => normalizeCatalogItem((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.item_code))
      .sort((a, b) => a.sort_order - b.sort_order || a.item_label.localeCompare(b.item_label, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function listInventoryItems(): Promise<InventoryItem[]> {
  try {
    const raw = await callRpcFallback<unknown[]>(["rpc_inventory_items_list_v2", "rpc_inventory_items_list_v1"], {}, {
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 800,
    });

    return pickRows(raw)
      .map((row) => normalizeInventoryItem((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.inventory_item_id || row.item_code))
      .sort((a, b) => a.item_label.localeCompare(b.item_label, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function upsertInventoryItem(payload: InventoryUpsertPayload): Promise<InventoryUpsertResult> {
  try {
    const raw = await callRpcFallback<RpcObject | null>(["rpc_inventory_item_upsert_v2", "rpc_inventory_item_upsert"], payload as unknown as RpcObject, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 800,
    });

    return normalizeInventoryItem((raw ?? {}) as RpcObject);
  } catch (error) {
    throw toDomyliError(error);
  }
}
