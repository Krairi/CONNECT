import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";
import { isMissingRpcError } from "../../lib/errors";

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
  try {
    const rawResult = await callRpc<
      Record<string, never>,
      RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[]
    >("rpc_shopping_list_rebuild", {});

    const raw = unwrapRpcRow(rawResult);

    console.log("DOMYLI rpc_shopping_list_rebuild raw =>", rawResult);
    console.log("DOMYLI rpc_shopping_list_rebuild normalized =>", raw);

    return {
      rebuilt: true,
      items_count: Number(raw?.inserted_count ?? 0),
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    if (isMissingRpcError(error)) {
      return {
        rebuilt: false,
        items_count: 0,
        generated_at: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export async function readShoppingList(): Promise<ShoppingListItem[]> {
  try {
    const rawResult = await callRpc<
      Record<string, never>,
      RawShoppingListItem[] | RawShoppingListItem | null
    >("rpc_shopping_list_list", {});

    console.log("DOMYLI rpc_shopping_list_list raw =>", rawResult);

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
  } catch (error) {
    if (isMissingRpcError(error)) {
      return [];
    }
    throw error;
  }
}