import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type InventoryItemUpsertInput = {
  p_household_id: string;
  p_name: string;
  p_category?: string | null;
  p_unit?: string | null;
  p_qty_on_hand: number;
  p_min_qty?: number | null;
  p_item_code?: string | null;
  p_category_code?: string | null;
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

function isRpcSignatureError(error: unknown, rpcName: string): boolean {
  const normalized = toDomyliError(error);
  const haystack = `${normalized.message ?? ""} ${normalized.details ?? ""} ${normalized.hint ?? ""}`.toLowerCase();

  return (
    normalized.code === "PGRST202" ||
    haystack.includes("could not find the function") ||
    haystack.includes("schema cache") ||
    haystack.includes(rpcName.toLowerCase())
  );
}

function normalizeInventoryItem(
  raw: RawInventoryItemUpsertOutput | RawInventoryItemUpsertOutput[] | null | undefined,
  payload: InventoryItemUpsertInput
): InventoryItemUpsertOutput {
  const row = pickFirst(raw);

  return {
    item_id: row?.item_id ?? row?.inventory_item_id ?? "",
    stock_key: row?.stock_key ?? null,
    item_name: row?.item_name ?? row?.name ?? payload.p_name,
    qty_on_hand: Number(row?.qty_on_hand ?? payload.p_qty_on_hand),
    min_qty: Number(row?.min_qty ?? payload.p_min_qty ?? 0),
    unit: row?.unit ?? payload.p_unit ?? null,
  };
}

function buildInventoryCandidates(payload: InventoryItemUpsertInput): Array<Record<string, unknown>> {
  const basePayload: Record<string, unknown> = {
    p_household_id: payload.p_household_id,
    p_name: payload.p_name.trim(),
    p_category: trimToNull(payload.p_category),
    p_unit: trimToNull(payload.p_unit),
    p_qty_on_hand: Number(payload.p_qty_on_hand),
    p_min_qty:
      payload.p_min_qty === null || payload.p_min_qty === undefined
        ? null
        : Number(payload.p_min_qty),
  };

  const enrichedPayload: Record<string, unknown> = {
    ...basePayload,
    p_item_code: trimToNull(payload.p_item_code),
    p_category_code: trimToNull(payload.p_category_code),
  };

  const hasCanonicalCodes =
    typeof enrichedPayload.p_item_code === "string" ||
    typeof enrichedPayload.p_category_code === "string";

  return hasCanonicalCodes ? [enrichedPayload, basePayload] : [basePayload];
}

export async function upsertInventoryItem(
  payload: InventoryItemUpsertInput
): Promise<InventoryItemUpsertOutput> {
  const candidates = buildInventoryCandidates(payload);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const raw = await callRpc("rpc_inventory_item_upsert", candidate);
      return normalizeInventoryItem(
        raw as RawInventoryItemUpsertOutput | RawInventoryItemUpsertOutput[] | null,
        payload
      );
    } catch (error) {
      lastError = error;

      if (!isRpcSignatureError(error, "rpc_inventory_item_upsert")) {
        throw toDomyliError(error);
      }
    }
  }

  throw toDomyliError(lastError);
}

async function rebuildShoppingRpc(
  householdId: string
): Promise<RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[] | null> {
  try {
    return (await callRpc("rpc_shopping_list_rebuild", {
      p_household_id: householdId,
    })) as RawShoppingListRebuildOutput | RawShoppingListRebuildOutput[] | null;
  } catch (error) {
    if (!isRpcSignatureError(error, "rpc_shopping_list_rebuild")) {
      throw toDomyliError(error);
    }

    return (await callRpc("rpc_shopping_list_rebuild", {})) as
      | RawShoppingListRebuildOutput
      | RawShoppingListRebuildOutput[]
      | null;
  }
}

export async function rebuildShoppingListForHousehold(
  householdId: string
): Promise<ShoppingListRebuildForHouseholdOutput> {
  const raw = await rebuildShoppingRpc(householdId);
  const row = pickFirst(raw);

  return {
    rebuilt: true,
    items_count: Number(row?.inserted_count ?? row?.existing_open_count ?? 0),
    generated_at: row?.generated_at ?? new Date().toISOString(),
  };
}