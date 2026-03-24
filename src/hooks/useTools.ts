import { useCallback, useState } from "react";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  upsertTool,
  reserveTool,
  releaseTool,
  type ToolUpsertInput,
  type ToolUpsertOutput,
} from "../services/tools/toolService";

export type ToolDraft = {
  tool_id: string;
  name: string;
  category: string;
  description: string;
  is_active: boolean;
  asset_id: string | null;
  asset_name: string;
  asset_status: string;
  asset_notes: string;
};

type ToolsState = {
  saving: boolean;
  reserving: boolean;
  releasing: boolean;
  error: DomyliAppError | null;
  tools: ToolDraft[];
  lastUpsertResult: ToolUpsertOutput | null;
  lastReservationId: string | null;
  lastReleaseId: string | null;
};

const initialState: ToolsState = {
  saving: false,
  reserving: false,
  releasing: false,
  error: null,
  tools: [],
  lastUpsertResult: null,
  lastReservationId: null,
  lastReleaseId: null,
};

export function useTools() {
  const [state, setState] = useState<ToolsState>(initialState);

  const saveTool = useCallback(async (payload: ToolUpsertInput) => {
    setState((prev) => ({
      ...prev,
      saving: true,
      error: null,
      lastUpsertResult: null,
    }));

    try {
      const result = await upsertTool(payload);

      if (!result.tool_id) {
        throw new Error("DOMYLI_TOOL_UPSERT_EMPTY_RESULT");
      }

      const tool: ToolDraft = {
        tool_id: result.tool_id,
        name: payload.p_name,
        category: payload.p_category ?? "",
        description: payload.p_description ?? "",
        is_active: payload.p_is_active ?? true,
        asset_id: result.asset_id ?? null,
        asset_name: payload.p_asset_name ?? "",
        asset_status: payload.p_asset_status ?? "AVAILABLE",
        asset_notes: payload.p_asset_notes ?? "",
      };

      setState((prev) => {
        const exists = prev.tools.some((item) => item.tool_id === result.tool_id);

        return {
          ...prev,
          saving: false,
          lastUpsertResult: result,
          tools: exists
            ? prev.tools.map((item) => (item.tool_id === result.tool_id ? tool : item))
            : [tool, ...prev.tools],
        };
      });

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

  const reserveToolAsset = useCallback(
    async (
      toolAssetId: string,
      startsAt: string,
      endsAt: string,
      taskInstanceId?: string | null,
      notes?: string | null
    ) => {
      setState((prev) => ({
        ...prev,
        reserving: true,
        error: null,
        lastReservationId: null,
      }));

      try {
        const reservationId = await reserveTool({
          p_tool_asset_id: toolAssetId,
          p_starts_at: startsAt,
          p_ends_at: endsAt,
          p_task_instance_id: taskInstanceId ?? null,
          p_notes: notes ?? null,
        });

        setState((prev) => ({
          ...prev,
          reserving: false,
          lastReservationId: reservationId,
        }));

        return reservationId;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          reserving: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    []
  );

  const releaseToolReservation = useCallback(
    async (reservationId: string, status?: string | null) => {
      setState((prev) => ({
        ...prev,
        releasing: true,
        error: null,
        lastReleaseId: null,
      }));

      try {
        const releasedReservationId = await releaseTool({
          p_reservation_id: reservationId,
          p_status: status ?? "RELEASED",
        });

        setState((prev) => ({
          ...prev,
          releasing: false,
          lastReleaseId: releasedReservationId,
        }));

        return releasedReservationId;
      } catch (error) {
        const normalized = toDomyliError(error);
        setState((prev) => ({
          ...prev,
          releasing: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    []
  );

  return {
    ...state,
    saveTool,
    reserveToolAsset,
    releaseToolReservation,
  };
}