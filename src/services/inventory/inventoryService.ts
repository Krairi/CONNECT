import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type InventoryItemUpsertInput = {
  p_name: string;
  p_category?: string | null;
  p_unit?: string | null;
  p_qty_on_hand: number;
  p_min_qty?: number | null;
};

export type InventoryItemUpsertOutput = {
  inventory_item_id: string;
  item_name: string;
  qty_on_hand: number;
  min_qty: number;
};

type RawInventoryItemUpsertOutput = {
  inventory_item_id?: string | null;
  item_id?: string | null;
  item_name?: string | null;
  name?: string | null;
  qty_on_hand?: number | null;
  min_qty?: number | null;
};

type RawShoppingListRebuildOutput = {
  inserted_count?: number | null;
  existing_open_count?: number | null;
};

export type ShoppingListRebuildOutput = {
  rebuilt: boolean;
  items_count: number;
  generated_at: string;
};

export async function upsertInventoryItem(
  payload: InventoryItemUpsertInput
): Promise<InventoryItemUpsertOutput> {
  const rawResult = await callRpc<RawInventoryItemUpsertOutput | RawInventoryItemUpsertOutput[]>(
    "rpc_inventory_item_upsert",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    inventory_item_id: raw?.inventory_item_id ?? raw?.item_id ?? "",
    item_name: raw?.item_name ?? raw?.name ?? payload.p_name,
    qty_on_hand: Number(raw?.qty_on_hand ?? payload.p_qty_on_hand),
    min_qty: Number(raw?.min_qty ?? payload.p_min_qty ?? 0),
  };
}

export async function rebuildShoppingList(): Promise<ShoppingListRebuildOutput> {
  const rawResult = await callRpc<RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[]>(
    "rpc_shopping_list_rebuild",
    {}
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    rebuilt: true,
    items_count: Number(raw?.inserted_count ?? raw?.existing_open_count ?? 0),
    generated_at: new Date().toISOString(),
  };
}
