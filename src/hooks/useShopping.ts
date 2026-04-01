import { useCallback, useEffect, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  listShoppingItems,
  rebuildShoppingProjection,
  type ShoppingItem,
  type ShoppingOriginType,
  type ShoppingPriorityCode,
  type ShoppingRebuildResult,
} from "@/src/services/shopping/shoppingService";

type ShoppingState = {
  loading: boolean;
  rebuilding: boolean;
  error: DomyliAppError | null;
  items: ShoppingItem[];
  selectedItemKey: string;
  selectedOrigin: string;
  selectedPriority: string;
  lastRebuild: ShoppingRebuildResult | null;
};

const initialState: ShoppingState = {
  loading: false,
  rebuilding: false,
  error: null,
  items: [],
  selectedItemKey: "",
  selectedOrigin: "ALL",
  selectedPriority: "ALL",
  lastRebuild: null,
};

export function useShopping() {
  const [state, setState] = useState<ShoppingState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const items = await listShoppingItems();
      setState((prev) => ({
        ...prev,
        loading: false,
        items,
        selectedItemKey:
          prev.selectedItemKey && items.some((item) => item.item_key === prev.selectedItemKey)
            ? prev.selectedItemKey
            : items[0]?.item_key ?? "",
      }));
      return items;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, loading: false, error: normalized }));
      throw normalized;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rebuild = useCallback(async () => {
    setState((prev) => ({ ...prev, rebuilding: true, error: null }));
    try {
      const result = await rebuildShoppingProjection();
      const items = await listShoppingItems();
      setState((prev) => ({
        ...prev,
        rebuilding: false,
        items,
        lastRebuild: result,
        selectedItemKey:
          prev.selectedItemKey && items.some((item) => item.item_key === prev.selectedItemKey)
            ? prev.selectedItemKey
            : items[0]?.item_key ?? "",
      }));
      return result;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({ ...prev, rebuilding: false, error: normalized }));
      throw normalized;
    }
  }, []);

  const setSelectedItemKey = useCallback((itemKey: string) => {
    setState((prev) => ({ ...prev, selectedItemKey: itemKey }));
  }, []);

  const setSelectedOrigin = useCallback((value: string) => {
    setState((prev) => ({ ...prev, selectedOrigin: value }));
  }, []);

  const setSelectedPriority = useCallback((value: string) => {
    setState((prev) => ({ ...prev, selectedPriority: value }));
  }, []);

  const originOptions = useMemo(() => {
    const options = Array.from(new Set(state.items.map((item) => item.origin_type))).filter(Boolean) as ShoppingOriginType[];
    return ["ALL", ...options];
  }, [state.items]);

  const priorityOptions = useMemo(() => {
    const options = Array.from(new Set(state.items.map((item) => item.priority_code))).filter(Boolean) as ShoppingPriorityCode[];
    return ["ALL", ...options];
  }, [state.items]);

  const filteredItems = useMemo(() => {
    return state.items.filter((item) => {
      const originOk = state.selectedOrigin === "ALL" || item.origin_type === state.selectedOrigin;
      const priorityOk = state.selectedPriority === "ALL" || item.priority_code === state.selectedPriority;
      return originOk && priorityOk;
    });
  }, [state.items, state.selectedOrigin, state.selectedPriority]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.item_key === state.selectedItemKey) ?? filteredItems[0] ?? null;
  }, [filteredItems, state.selectedItemKey]);

  const summary = useMemo(() => {
    const total = state.items.length;
    const open = state.items.filter((item) => !["DONE", "ARCHIVED", "CANCELLED"].includes(item.shopping_status)).length;
    const critical = state.items.filter((item) => item.priority_code === "CRITICAL").length;
    const high = state.items.filter((item) => item.priority_code === "HIGH").length;
    const inventoryOrigin = state.items.filter((item) => item.origin_type === "INVENTORY_THRESHOLD").length;
    const mealOrigin = state.items.filter((item) => item.origin_type === "MEAL_CONFIRMATION").length;
    return { total, open, critical, high, inventoryOrigin, mealOrigin };
  }, [state.items]);

  return {
    ...state,
    filteredItems,
    selectedItem,
    summary,
    originOptions,
    priorityOptions,
    refresh,
    rebuild,
    setSelectedItemKey,
    setSelectedOrigin,
    setSelectedPriority,
  };
}
