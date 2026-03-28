import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type ShoppingListItem = {
  shopping_item_id: string;
  item_name: string;
  quantity_needed: number;
  unit: string | null;
  priority: string | null;
  status: string | null;
};

type RawShoppingListItem = {
  shopping_item_id?: string | null;
  item_id?: string | null;
  item_name?: string | null;
  name?: string | null;
  quantity_needed?: number | string | null;
  qty_needed?: number | string | null;
  unit?: string | null;
  priority?: string | null;
  status?: string | null;
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

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function readShoppingList(): Promise<ShoppingListItem[]> {
  try {
    const raw = (await callRpc(
      "rpc_shopping_list_list",
      {},
    )) as RawShoppingListItem[] | RawShoppingListItem | null;

    const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];

    return rows.map((item) => ({
      shopping_item_id: item.shopping_item_id ?? item.item_id ?? "",
      item_name: item.item_name ?? item.name ?? "Article DOMYLI",
      quantity_needed: toNumber(item.quantity_needed ?? item.qty_needed, 0),
      unit: item.unit ?? null,
      priority: item.priority ?? null,
      status: item.status ?? null,
    }));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function rebuildShoppingList(): Promise<ShoppingListRebuildOutput> {
  try {
    const raw = (await callRpc(
      "rpc_shopping_list_rebuild",
      {},
      { unwrap: true },
    )) as RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[] | null;

    const row = pickFirst(raw);

    return {
      rebuilt: true,
      items_count: toNumber(
        row?.items_count ?? row?.inserted_count ?? row?.existing_open_count,
        0,
      ),
      generated_at: row?.generated_at ?? new Date().toISOString(),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}