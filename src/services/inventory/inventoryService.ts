import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type InventoryItemUpsertInput = {
  p_household_id: string;
  p_item_id?: string | null;
  p_name: string;
  p_category?: string | null;
  p_unit?: string | null;
  p_qty_on_hand: number;
  p_min_qty?: number | null;
};

export type InventoryItemUpsertOutput = {
  item_id: string;
  stock_key: string;
  qty_on_hand: number;
  min_qty: number | null;
  updated_at: string;
};

type RawInventoryItemUpsertOutput = {
  item_id?: string | null;
  stock_key?: string | null;
  qty_on_hand?: number | null;
  min_qty?: number | null;
  updated_at?: string | null;
};

export type ShoppingListRebuildInput = {
  p_household_id: string;
};

export type ShoppingListRebuildOutput = {
  rebuilt: boolean;
  items_count: number;
  generated_at: string;
};

type RawShoppingListRebuildOutput = {
  rebuilt?: boolean | null;
  items_count?: number | null;
  generated_at?: string | null;
};

export async function upsertInventoryItem(
  payload: InventoryItemUpsertInput
): Promise<InventoryItemUpsertOutput> {
  const rawResult = await callRpc<
    InventoryItemUpsertInput,
    RawInventoryItemUpsertOutput | RawInventoryItemUpsertOutput[]
  >("rpc_inventory_item_upsert", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_inventory_item_upsert raw =>", rawResult);
  console.log("DOMYLI rpc_inventory_item_upsert normalized =>", raw);

  return {
    item_id: raw?.item_id ?? "",
    stock_key: raw?.stock_key ?? "",
    qty_on_hand: Number(raw?.qty_on_hand ?? payload.p_qty_on_hand ?? 0),
    min_qty: raw?.min_qty ?? payload.p_min_qty ?? null,
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}

export async function rebuildShoppingList(
  payload: ShoppingListRebuildInput
): Promise<ShoppingListRebuildOutput> {
  const rawResult = await callRpc<
    ShoppingListRebuildInput,
    RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[]
  >("rpc_shopping_list_rebuild", payload);

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_shopping_list_rebuild raw =>", rawResult);
  console.log("DOMYLI rpc_shopping_list_rebuild normalized =>", raw);

  return {
    rebuilt: Boolean(raw?.rebuilt),
    items_count: Number(raw?.items_count ?? 0),
    generated_at: raw?.generated_at ?? new Date().toISOString(),
  };
}