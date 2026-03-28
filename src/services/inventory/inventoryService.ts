import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type InventoryItemUpsertInput = {
  p_household_id: string;
  p_name: string;
  p_category: string;
  p_unit: string;
  p_qty_on_hand: number;
  p_min_qty?: number | null;
  p_item_code: string;
  p_category_code: string;
};

export type InventoryItemUpsertOutput = {
  item_id: string;
  stock_key: string | null;
  item_name: string;
  qty_on_hand: number;
  min_qty: number;
  unit: string | null;
};

type RawInventoryItemUpsertOutput = {
  item_id?: string | null;
  inventory_item_id?: string | null;
  id?: string | null;
  stock_key?: string | null;
  item_name?: string | null;
  name?: string | null;
  qty_on_hand?: number | string | null;
  min_qty?: number | string | null;
  unit?: string | null;
};

type RawShoppingListRebuildOutput = {
  inserted_count?: number | string | null;
  existing_open_count?: number | string | null;
  items_count?: number | string | null;
  generated_at?: string | null;
};

export type ShoppingListRebuildOutput = {
  rebuilt: boolean;
  items_count: number;
  generated_at: string;
};

function trimRequired(value: string, fieldLabel: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldLabel} est obligatoire.`);
  }

  return normalized;
}

function trimToNull(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  const normalized = Number(value);

  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeInventoryItem(
  raw:
    | RawInventoryItemUpsertOutput
    | RawInventoryItemUpsertOutput[]
    | null
    | undefined,
  payload: InventoryItemUpsertInput,
): InventoryItemUpsertOutput {
  const row = pickFirst(raw);

  return {
    item_id: row?.item_id ?? row?.inventory_item_id ?? row?.id ?? "",
    stock_key: row?.stock_key ?? null,
    item_name: row?.item_name ?? row?.name ?? payload.p_name,
    qty_on_hand: toNumber(row?.qty_on_hand, payload.p_qty_on_hand),
    min_qty: toNumber(row?.min_qty, payload.p_min_qty ?? 0),
    unit: row?.unit ?? payload.p_unit,
  };
}

export async function upsertInventoryItem(
  payload: InventoryItemUpsertInput,
): Promise<InventoryItemUpsertOutput> {
  try {
    const raw = await callRpc("rpc_inventory_item_upsert", {
      p_household_id: payload.p_household_id,
      p_name: trimRequired(payload.p_name, "Le nom de l’article"),
      p_category: trimRequired(payload.p_category, "La catégorie"),
      p_unit: trimRequired(payload.p_unit, "L’unité"),
      p_qty_on_hand: Number(payload.p_qty_on_hand),
      p_min_qty:
        payload.p_min_qty === null || payload.p_min_qty === undefined
          ? null
          : Number(payload.p_min_qty),
      p_item_code: trimRequired(payload.p_item_code, "Le code article"),
      p_category_code: trimRequired(
        payload.p_category_code,
        "Le code catégorie",
      ),
    });

    return normalizeInventoryItem(
      raw as RawInventoryItemUpsertOutput | RawInventoryItemUpsertOutput[] | null,
      payload,
    );
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function rebuildShoppingList(): Promise<ShoppingListRebuildOutput> {
  try {
    const raw = (await callRpc(
      "rpc_shopping_list_rebuild",
      {},
    )) as RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[] | null;

    const row = pickFirst(raw);

    return {
      rebuilt: true,
      items_count: toNumber(
        row?.items_count ?? row?.inserted_count ?? row?.existing_open_count,
        0,
      ),
      generated_at: trimToNull(row?.generated_at) ?? new Date().toISOString(),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}