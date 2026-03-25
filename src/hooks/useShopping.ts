import { useCallback, useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  readShoppingList,
  rebuildShoppingList,
  type ShoppingListItem,
  type ShoppingListRebuildOutput,
} from "@/src/services/shopping/shoppingService";

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

export function useShopping(householdId: string | null) {
  const [state, setState] = useState<ShoppingState>(initialState);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setState((prev) => ({
        ...prev,
        loading: false,
        items: [],
      }));
      return [];
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const items = await readShoppingList(householdId);

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
  }, [householdId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rebuild = useCallback(async () => {
    if (!householdId) {
      return null;
    }

    setState((prev) => ({
      ...prev,
      rebuilding: true,
      error: null,
    }));

    try {
      const rebuilt = await rebuildShoppingList(householdId);
      const items = await readShoppingList(householdId);

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
  }, [householdId]);

  return {
    ...state,
    refresh,
    rebuild,
  };
}