import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type ShoppingListRebuildOutput = {
  rebuilt: boolean;
  items_count: number;
  generated_at: string;
};

type RawShoppingListRebuildOutput = {
  household_id?: string | null;
  inserted_count?: number | null;
  existing_open_count?: number | null;
};

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
  item_name?: string | null;
  quantity_needed?: number | null;
  unit?: string | null;
  priority?: string | null;
  status?: string | null;
};

export async function rebuildShoppingList(): Promise<ShoppingListRebuildOutput> {
  const rawResult = await callRpc<RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[]>(
    "rpc_shopping_list_rebuild",
    {}
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    rebuilt: true,
    items_count: Number(raw?.inserted_count ?? 0),
    generated_at: new Date().toISOString(),
  };
}

export async function readShoppingList(): Promise<ShoppingListItem[]> {
  const rawResult = await callRpc<RawShoppingListItem[] | RawShoppingListItem | null>(
    "rpc_shopping_list_list",
    {}
  );

  const rows = Array.isArray(rawResult)
    ? rawResult
    : rawResult
    ? [rawResult]
    : [];

  return rows.map((row) => ({
    shopping_item_id: row.shopping_item_id ?? "",
    item_name: row.item_name ?? "Article DOMYLI",
    quantity_needed: Number(row.quantity_needed ?? 0),
    unit: row.unit ?? null,
    priority: row.priority ?? null,
    status: row.status ?? null,
  }));
}