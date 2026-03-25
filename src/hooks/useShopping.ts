import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  rebuildShoppingList,
  readShoppingList,
  type ShoppingListItem,
  type ShoppingListRebuildOutput,
} from "../services/shopping/shoppingService";

type ShoppingState = {
  loading: boolean;
  rebuilding: boolean;
  error: DomyliAppError | null;
  items: ShoppingListItem[];
  lastRebuild: ShoppingListRebuildOutput | null;
};

const initialState: ShoppingState = {
  loading: false,
  rebuilding: false,
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
    }));

    try {
      const items = await readShoppingList();

      setState((prev) => ({
        ...prev,
        loading: false,
        items,
      }));

      return items;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rebuild = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      rebuilding: true,
      error: null,
    }));

    try {
      const rebuilt = await rebuildShoppingList();
      const items = await readShoppingList();

      setState((prev) => ({
        ...prev,
        rebuilding: false,
        items,
        lastRebuild: rebuilt,
      }));

      return rebuilt;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        rebuilding: false,
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