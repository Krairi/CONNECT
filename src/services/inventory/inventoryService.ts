import { createDomyliError, toDomyliError } from "@/src/lib/errors";
import { callRpc } from "@/src/services/rpc";

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

type InventorySignatureInput = {
  householdId: string;
  itemName: string;
  itemCode: string | null;
  categoryLabel: string | null;
  categoryCode: string | null;
  unit: string | null;
  qtyOnHand: number;
  minQty: number | null;
};

function trimToNull(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uniquePayloads(
  payloads: Array<Record<string, unknown> | null>
): Array<Record<string, unknown>> {
  const seen = new Set<string>();
  const result: Array<Record<string, unknown>> = [];

  for (const payload of payloads) {
    if (!payload) continue;

    const key = JSON.stringify(payload);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(payload);
  }

  return result;
}

function shouldRetryMissingRpc(error: unknown, rpcName: string): boolean {
  const normalized = toDomyliError(error);
  const message = `${normalized.message ?? ""} ${normalized.details ?? ""} ${normalized.hint ?? ""}`.toLowerCase();

  return (
    normalized.code === "PGRST202" ||
    message.includes("could not find the function") ||
    message.includes("schema cache") ||
    message.includes(`function app.${rpcName}`) ||
    message.includes(`app.${rpcName}(`)
  );
}

function buildNamePayload(
  input: InventorySignatureInput,
  nameKey: "p_name" | "p_item_name",
  nameValue: string,
  qtyKey: "p_qty_on_hand" | "p_quantity_on_hand" | "p_qty",
  options?: {
    includeCategory?: boolean;
    includeUnit?: boolean;
    includeMinQty?: boolean;
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    p_household_id: input.householdId,
    [nameKey]: nameValue,
    [qtyKey]: input.qtyOnHand,
  };

  if (options?.includeCategory && input.categoryLabel) {
    payload.p_category = input.categoryLabel;
  }

  if (options?.includeUnit && input.unit) {
    payload.p_unit = input.unit;
  }

  if (options?.includeMinQty && input.minQty !== null) {
    payload.p_min_qty = input.minQty;
  }

  return payload;
}

function buildCodePayload(
  input: InventorySignatureInput,
  codeKey: "p_item_code" | "p_stock_key",
  qtyKey: "p_qty_on_hand" | "p_quantity_on_hand" | "p_qty",
  options?: {
    includeCategoryCode?: boolean;
    includeUnit?: boolean;
    includeMinQty?: boolean;
  }
): Record<string, unknown> | null {
  if (!input.itemCode) {
    return null;
  }

  const payload: Record<string, unknown> = {
    p_household_id: input.householdId,
    [codeKey]: input.itemCode,
    [qtyKey]: input.qtyOnHand,
  };

  if (options?.includeCategoryCode && input.categoryCode) {
    payload.p_category_code = input.categoryCode;
  }

  if (options?.includeUnit && input.unit) {
    payload.p_unit = input.unit;
  }

  if (options?.includeMinQty && input.minQty !== null) {
    payload.p_min_qty = input.minQty;
  }

  return payload;
}

function buildHybridPayload(
  input: InventorySignatureInput,
  qtyKey: "p_qty_on_hand" | "p_quantity_on_hand" | "p_qty"
): Record<string, unknown> | null {
  if (!input.itemCode) {
    return null;
  }

  const payload: Record<string, unknown> = {
    p_household_id: input.householdId,
    p_name: input.itemName,
    p_item_code: input.itemCode,
    [qtyKey]: input.qtyOnHand,
  };

  if (input.categoryLabel) {
    payload.p_category = input.categoryLabel;
  }

  if (input.categoryCode) {
    payload.p_category_code = input.categoryCode;
  }

  if (input.unit) {
    payload.p_unit = input.unit;
  }

  if (input.minQty !== null) {
    payload.p_min_qty = input.minQty;
  }

  return payload;
}

function buildInventoryPayloadVariants(
  payload: InventoryItemUpsertInput
): Array<Record<string, unknown>> {
  const input: InventorySignatureInput = {
    householdId: payload.p_household_id,
    itemName: payload.p_name.trim(),
    itemCode: trimToNull(payload.p_item_code),
    categoryLabel: trimToNull(payload.p_category),
    categoryCode: trimToNull(payload.p_category_code),
    unit: trimToNull(payload.p_unit),
    qtyOnHand: Number(payload.p_qty_on_hand),
    minQty:
      payload.p_min_qty === null || payload.p_min_qty === undefined
        ? null
        : Number(payload.p_min_qty),
  };

  const namesToTry = uniquePayloads([
    { value: input.itemName },
    input.itemCode ? { value: input.itemCode } : null,
  ]).map((entry) => String(entry.value));

  const payloads: Array<Record<string, unknown> | null> = [];

  for (const nameValue of namesToTry) {
    payloads.push(
      buildNamePayload(input, "p_name", nameValue, "p_qty_on_hand", {
        includeCategory: true,
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_name", nameValue, "p_qty_on_hand", {
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_name", nameValue, "p_qty_on_hand", {
        includeUnit: true,
      }),
      buildNamePayload(input, "p_name", nameValue, "p_qty_on_hand"),
      buildNamePayload(input, "p_item_name", nameValue, "p_qty_on_hand", {
        includeCategory: true,
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_item_name", nameValue, "p_qty_on_hand", {
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_item_name", nameValue, "p_qty_on_hand", {
        includeUnit: true,
      }),
      buildNamePayload(input, "p_item_name", nameValue, "p_qty_on_hand"),
      buildNamePayload(input, "p_name", nameValue, "p_quantity_on_hand", {
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_name", nameValue, "p_qty", {
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_item_name", nameValue, "p_quantity_on_hand", {
        includeUnit: true,
        includeMinQty: true,
      }),
      buildNamePayload(input, "p_item_name", nameValue, "p_qty", {
        includeUnit: true,
        includeMinQty: true,
      })
    );
  }

  payloads.push(
    buildHybridPayload(input, "p_qty_on_hand"),
    buildHybridPayload(input, "p_quantity_on_hand"),
    buildHybridPayload(input, "p_qty"),
    buildCodePayload(input, "p_item_code", "p_qty_on_hand", {
      includeCategoryCode: true,
      includeUnit: true,
      includeMinQty: true,
    }),
    buildCodePayload(input, "p_item_code", "p_qty_on_hand", {
      includeUnit: true,
      includeMinQty: true,
    }),
    buildCodePayload(input, "p_item_code", "p_quantity_on_hand", {
      includeCategoryCode: true,
      includeUnit: true,
      includeMinQty: true,
    }),
    buildCodePayload(input, "p_item_code", "p_qty", {
      includeCategoryCode: true,
      includeUnit: true,
      includeMinQty: true,
    }),
    buildCodePayload(input, "p_stock_key", "p_qty_on_hand", {
      includeCategoryCode: true,
      includeUnit: true,
      includeMinQty: true,
    }),
    buildCodePayload(input, "p_stock_key", "p_qty_on_hand", {
      includeUnit: true,
      includeMinQty: true,
    })
  );

  return uniquePayloads(payloads);
}

function normalizeInventoryItemOutput(
  raw: RawInventoryItemUpsertOutput | null,
  payload: InventoryItemUpsertInput
): InventoryItemUpsertOutput {
  return {
    item_id: raw?.item_id ?? raw?.inventory_item_id ?? "",
    stock_key: raw?.stock_key ?? null,
    item_name: raw?.item_name ?? raw?.name ?? payload.p_name,
    qty_on_hand: Number(raw?.qty_on_hand ?? payload.p_qty_on_hand),
    min_qty: Number(raw?.min_qty ?? payload.p_min_qty ?? 0),
    unit: raw?.unit ?? payload.p_unit ?? null,
  };
}

function createInventorySignatureError(lastError: unknown): Error {
  const normalized = toDomyliError(lastError);

  return createDomyliError({
    message:
      "La RPC d’inventaire DOMYLI existe probablement avec une signature différente de celle attendue par le front.",
    code: normalized.code ?? "DOMYLI_INVENTORY_RPC_SIGNATURE_MISMATCH",
    details: normalized.message,
    hint:
      "Le front a essayé plusieurs signatures compatibles avec les libellés et avec les codes canoniques. Si l’erreur continue, il faudra aligner la signature réelle de app.rpc_inventory_item_upsert côté Supabase ou recharger le cache PostgREST.",
  });
}

async function upsertInventoryRpc(
  payload: InventoryItemUpsertInput
): Promise<RawInventoryItemUpsertOutput | null> {
  const variants = buildInventoryPayloadVariants(payload);
  let lastError: unknown = null;

  for (const candidate of variants) {
    try {
      return await callRpc<RawInventoryItemUpsertOutput | null>(
        "rpc_inventory_item_upsert",
        candidate,
        { unwrap: true }
      );
    } catch (error) {
      lastError = error;

      if (!shouldRetryMissingRpc(error, "rpc_inventory_item_upsert")) {
        throw error;
      }
    }
  }

  throw createInventorySignatureError(lastError);
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
    if (!shouldRetryMissingRpc(error, "rpc_shopping_list_rebuild")) {
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
  const raw = await upsertInventoryRpc(payload);
  return normalizeInventoryItemOutput(raw, payload);
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