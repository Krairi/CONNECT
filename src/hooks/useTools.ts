import { useCallback, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  upsertTool,
  reserveTool,
  releaseTool,
  type ToolUpsertOutput,
  type ToolReserveOutput,
  type ToolReleaseOutput,
} from "@/src/services/tools/toolService";

type ToolsState = {
  saving: boolean;
  reserving: boolean;
  releasing: boolean;
  error: DomyliAppError | null;
  lastSavedTool: ToolUpsertOutput | null;
  lastReservation: ToolReserveOutput | null;
  lastRelease: ToolReleaseOutput | null;
};

const initialState: ToolsState = {
  saving: false,
  reserving: false,
  releasing: false,
  error: null,
  lastSavedTool: null,
  lastReservation: null,
  lastRelease: null,
};

export function useTools() {
  const [state, setState] = useState(initialState);

  const saveTool = useCallback(async (payload: {
    name: string;
    category?: string | null;
  }) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
    }));

    try {
      const result = await upsertTool({
        p_name: payload.name,
        p_category: payload.category ?? null,
      });

      setState((prev) => ({
        ...prev,
        saving: false,
        lastSavedTool: result,
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

  const reserveToolSlot = useCallback(async (payload: {
    toolAssetId: string;
    startAt: string;
    endAt: string;
  }) => {
    setState((prev) => ({
      ...prev,
      reserving: true,
      error: null,
    }));

    try {
      const result = await reserveTool({
        p_tool_asset_id: payload.toolAssetId,
        p_start_at: payload.startAt,
        p_end_at: payload.endAt,
      });

      setState((prev) => ({
        ...prev,
        reserving: false,
        lastReservation: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        reserving: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  const releaseToolSlot = useCallback(async (reservationId: string) => {
    setState((prev) => ({
      ...prev,
      releasing: true,
      error: null,
    }));

    try {
      const result = await releaseTool({
        p_tool_reservation_id: reservationId,
      });

      setState((prev) => ({
        ...prev,
        releasing: false,
        lastRelease: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        releasing: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  return {
    ...state,
    saveTool,
    reserveToolSlot,
    releaseToolSlot,
  };
}