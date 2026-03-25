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
  quantity_needed?: number | null;
  qty_needed?: number | null;
  unit?: string | null;
  priority?: string | null;
  status?: string | null;
};

type RawShoppingListRebuildOutput = {
  inserted_count?: number | null;
  existing_open_count?: number | null;
  generated_at?: string | null;
};

export type ShoppingListRebuildOutput = {
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
    message.includes("function app.rpc_shopping_list")
  );
}

async function readShoppingListRpc(
  householdId: string
): Promise<RawShoppingListItem[] | RawShoppingListItem | null> {
  try {
    return await callRpc<RawShoppingListItem[] | RawShoppingListItem | null>(
      "rpc_shopping_list_list",
      { p_household_id: householdId }
    );
  } catch (error) {
    if (!shouldRetryWithoutPayload(error)) {
      throw error;
    }

    return await callRpc<RawShoppingListItem[] | RawShoppingListItem | null>(
      "rpc_shopping_list_list",
      {}
    );
  }
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

export async function readShoppingList(
  householdId: string
): Promise<ShoppingListItem[]> {
  const raw = await readShoppingListRpc(householdId);

  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return rows.map((item) => ({
    shopping_item_id: item.shopping_item_id ?? item.item_id ?? "",
    item_name: item.item_name ?? item.name ?? "Article DOMYLI",
    quantity_needed: Number(item.quantity_needed ?? item.qty_needed ?? 0),
    unit: item.unit ?? null,
    priority: item.priority ?? null,
    status: item.status ?? null,
  }));
}

export async function rebuildShoppingList(
  householdId: string
): Promise<ShoppingListRebuildOutput> {
  const raw = await rebuildShoppingRpc(householdId);

  return {
    rebuilt: true,
    items_count: Number(raw?.inserted_count ?? raw?.existing_open_count ?? 0),
    generated_at: raw?.generated_at ?? new Date().toISOString(),
  };
}