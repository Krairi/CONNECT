import { useCallback, useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  rebuildShoppingList,
  readShoppingList,
  type ShoppingListItem,
  type ShoppingListRebuildOutput,
} from "@/src/services/shopping/shoppingService";

type ShoppingState = {
  loading: boolean;
  rebuilding: boolean;
  degraded: boolean;
  error: DomyliAppError | null;
  items: ShoppingListItem[];
  lastRebuild: ShoppingListRebuildOutput | null;
};

const initialState: ShoppingState = {
  loading: false,
  rebuilding: false,
  degraded: false,
  error: null,
  items: [],
  lastRebuild: null,
};

export function useShopping() {
  const [state, setState] = useState<ShoppingState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      degraded: false,
    }));

    try {
      const items = await readShoppingList();

      setState((prev) => ({
        ...prev,
        loading: false,
        degraded: false,
        items,
      }));

      return items;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        degraded: prev.items.length > 0,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rebuild = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      rebuilding: true,
      error: null,
      degraded: false,
    }));

    try {
      const rebuilt = await rebuildShoppingList();
      const items = await readShoppingList();

      setState((prev) => ({
        ...prev,
        rebuilding: false,
        degraded: false,
        items,
        lastRebuild: rebuilt,
      }));

      return rebuilt;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        rebuilding: false,
        degraded: prev.items.length > 0 || Boolean(prev.lastRebuild),
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  return {
    ...state,
    refresh,
    rebuild,
  };
}