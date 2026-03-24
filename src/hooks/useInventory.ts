import { useCallback, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  upsertInventoryItem,
  rebuildShoppingList,
  type InventoryItemUpsertInput,
  type InventoryItemUpsertOutput,
  type ShoppingListRebuildOutput,
} from "../services/inventory/inventoryService";

type InventoryState = {
  saving: boolean;
  rebuilding: boolean;
  error: DomyliAppError | null;
  lastSavedItem: InventoryItemUpsertOutput | null;
  lastRebuild: ShoppingListRebuildOutput | null;
};

const initialState: InventoryState = {
  saving: false,
  rebuilding: false,
  error: null,
  lastSavedItem: null,
  lastRebuild: null,
};

export function useInventory() {
  const [state, setState] = useState<InventoryState>(initialState);

  const saveItem = useCallback(async (payload: InventoryItemUpsertInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
    }));

    try {
      const result = await upsertInventoryItem(payload);

      setState((prev) => ({
        ...prev,
        saving: false,
        error: null,
        lastSavedItem: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        saving: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const rebuildShopping = useCallback(async (householdId: string) => {
    setState((prev) => ({
      ...prev,
      rebuilding: true,
      error: null,
    }));

    try {
      const result = await rebuildShoppingList({
        p_household_id: householdId,
      });

      setState((prev) => ({
        ...prev,
        rebuilding: false,
        error: null,
        lastRebuild: result,
      }));

      return result;
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
    saveItem,
    rebuildShopping,
  };
}