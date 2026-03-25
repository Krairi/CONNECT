import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type InventoryItemUpsertInput = {
  p_household_id: string;
  p_name: string;
  p_category?: string | null;
  p_unit?: string | null;
  p_qty_on_hand: number;
  p_min_qty?: number | null;
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
  stock_key?: string | null;
  item_name?: string | null;
  name?: string | null;
  qty_on_hand?: number | null;
  min_qty?: number | null;
  unit?: string | null;
};

type RawShoppingListRebuildOutput = {
  inserted_count?: number | null;
  existing_open_count?: number | null;
  generated_at?: string | null;
};

export type ShoppingListRebuildForHouseholdOutput = {
  rebuilt: boolean;
  items_count: number;
  generated_at: string;
};

function shouldRetryWithoutPayload(error: unknown): boolean {
  const normalized = toDomyliError(error);
  const message = normalized.message?.toLowerCase() ?? "";

  return (
    normalized.code === "PGRST202" ||
    message.includes("could not find the function") ||
    message.includes("function app.rpc_shopping_list_rebuild")
  );
}

async function rebuildShoppingRpc(
  householdId: string
): Promise<RawShoppingListRebuildOutput | null> {
  try {
    return await callRpc<RawShoppingListRebuildOutput | null>(
      "rpc_shopping_list_rebuild",
      { p_household_id: householdId },
      { unwrap: true }
    );
  } catch (error) {
    if (!shouldRetryWithoutPayload(error)) {
      throw error;
    }

    return await callRpc<RawShoppingListRebuildOutput | null>(
      "rpc_shopping_list_rebuild",
      {},
      { unwrap: true }
    );
  }
}

export async function upsertInventoryItem(
  payload: InventoryItemUpsertInput
): Promise<InventoryItemUpsertOutput> {
  const raw = await callRpc<RawInventoryItemUpsertOutput | null>(
    "rpc_inventory_item_upsert",
    payload,
    { unwrap: true }
  );

  return {
    item_id: raw?.item_id ?? raw?.inventory_item_id ?? "",
    stock_key: raw?.stock_key ?? null,
    item_name: raw?.item_name ?? raw?.name ?? payload.p_name,
    qty_on_hand: Number(raw?.qty_on_hand ?? payload.p_qty_on_hand),
    min_qty: Number(raw?.min_qty ?? payload.p_min_qty ?? 0),
    unit: raw?.unit ?? payload.p_unit ?? null,
  };
}

export async function rebuildShoppingListForHousehold(
  householdId: string
): Promise<ShoppingListRebuildForHouseholdOutput> {
  const raw = await rebuildShoppingRpc(householdId);

  return {
    rebuilt: true,
    items_count: Number(raw?.inserted_count ?? raw?.existing_open_count ?? 0),
    generated_at: raw?.generated_at ?? new Date().toISOString(),
  };
}