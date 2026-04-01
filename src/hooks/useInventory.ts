import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  listInventoryCatalog,
  listInventoryItems,
  upsertInventoryItem,
  type InventoryCatalogItem,
  type InventoryItem,
  type InventoryUpsertResult,
} from "@/src/services/inventory/inventoryService";

type InventoryState = {
  loading: boolean;
  saving: boolean;
  error: DomyliAppError | null;
  catalog: InventoryCatalogItem[];
  items: InventoryItem[];
  selectedItemCode: string;
  qtyDraft: number;
  minQtyDraft: number;
  lastSaved: InventoryUpsertResult | null;
};

const initialState: InventoryState = {
  loading: false,
  saving: false,
  error: null,
  catalog: [],
  items: [],
  selectedItemCode: "",
  qtyDraft: 0,
  minQtyDraft: 0,
  lastSaved: null,
};

export function useInventory() {
  const [state, setState] = useState<InventoryState>(initialState);

  const syncDraftFromSelection = useCallback((itemCode: string, items: InventoryItem[]) => {
    const current = items.find((entry) => entry.item_code === itemCode);
    return {
      qtyDraft: current?.qty_on_hand ?? 0,
      minQtyDraft: current?.min_qty ?? 0,
    };
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [catalog, items] = await Promise.all([listInventoryCatalog(), listInventoryItems()]);
      setState((prev) => {
        const selectedItemCode = prev.selectedItemCode || items[0]?.item_code || catalog[0]?.item_code || "";
        const nextDraft = syncDraftFromSelection(selectedItemCode, items);
        return {
          ...prev,
          loading: false,
          catalog,
          items,
          selectedItemCode,
          qtyDraft: nextDraft.qtyDraft,
          minQtyDraft: nextDraft.minQtyDraft,
        };
      });
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, loading: false, error: normalized }));
      throw normalized;
    }
  }, [syncDraftFromSelection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectItemCode = useCallback(
    (itemCode: string) => {
      setState((prev) => {
        const nextDraft = syncDraftFromSelection(itemCode, prev.items);
        return {
          ...prev,
          selectedItemCode: itemCode,
          qtyDraft: nextDraft.qtyDraft,
          minQtyDraft: nextDraft.minQtyDraft,
        };
      });
    },
    [syncDraftFromSelection],
  );

  const setQtyDraft = useCallback((value: number) => {
    setState((prev) => ({ ...prev, qtyDraft: Math.max(0, Number.isFinite(value) ? value : 0) }));
  }, []);

  const setMinQtyDraft = useCallback((value: number) => {
    setState((prev) => ({ ...prev, minQtyDraft: Math.max(0, Number.isFinite(value) ? value : 0) }));
  }, []);

  const save = useCallback(async () => {
    if (!state.selectedItemCode) return null;
    setState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const result = await upsertInventoryItem({
        p_item_code: state.selectedItemCode,
        p_qty_on_hand: state.qtyDraft,
        p_min_qty: state.minQtyDraft,
      });

      const nextItems = [...state.items.filter((entry) => entry.item_code !== result.item_code), result].sort((a, b) =>
        a.item_label.localeCompare(b.item_label, "fr"),
      );

      setState((prev) => ({
        ...prev,
        saving: false,
        items: nextItems,
        lastSaved: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, saving: false, error: normalized }));
      throw normalized;
    }
  }, [state.items, state.minQtyDraft, state.qtyDraft, state.selectedItemCode]);

  const selectedCatalogItem = useMemo(
    () => state.catalog.find((entry) => entry.item_code === state.selectedItemCode) ?? null,
    [state.catalog, state.selectedItemCode],
  );

  const selectedInventoryItem = useMemo(
    () => state.items.find((entry) => entry.item_code === state.selectedItemCode) ?? null,
    [state.items, state.selectedItemCode],
  );

  const summary = useMemo(() => {
    const total = state.items.length;
    const out = state.items.filter((item) => item.stock_status === "OUT").length;
    const low = state.items.filter((item) => item.stock_status === "LOW").length;
    const healthy = state.items.filter((item) => item.stock_status === "HEALTHY").length;
    return { total, out, low, healthy };
  }, [state.items]);

  return {
    ...state,
    selectedCatalogItem,
    selectedInventoryItem,
    summary,
    refresh,
    save,
    selectItemCode,
    setQtyDraft,
    setMinQtyDraft,
  };
}
