import { useCallback, useMemo, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  upsertTool,
  reserveTool,
  releaseTool,
  type ToolUpsertInput,
  type ToolUpsertOutput,
} from "@/src/services/tools/toolService";

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

export type ToolAssetDraft = {
  asset_id: string;
  tool_id: string;
  tool_name: string;
  category: string;
  asset_name: string;
  asset_status: string;
  asset_notes: string;
};

export type ToolReservationDraft = {
  reservation_id: string;
  asset_id: string;
  asset_name: string;
  tool_name: string;
  starts_at: string;
  ends_at: string;
  notes: string;
  status: string;
};

type ToolsState = {
  saving: boolean;
  reserving: boolean;
  releasing: boolean;
  error: DomyliAppError | null;
  tools: ToolDraft[];
  reservations: ToolReservationDraft[];
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
  reservations: [],
  lastUpsertResult: null,
  lastReservationId: null,
  lastReleaseId: null,
};

function upsertArrayItem<T>(
  items: T[],
  matcher: (item: T) => boolean,
  next: T,
): T[] {
  const index = items.findIndex(matcher);

  if (index === -1) {
    return [next, ...items];
  }

  const clone = [...items];
  clone[index] = next;
  return clone;
}

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

      const nextTool: ToolDraft = {
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

      setState((prev) => ({
        ...prev,
        saving: false,
        lastUpsertResult: result,
        tools: upsertArrayItem(
          prev.tools,
          (item) => item.tool_id === nextTool.tool_id,
          nextTool,
        ),
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

  const reserveToolAsset = useCallback(
    async (
      assetId: string,
      startsAt: string,
      endsAt: string,
      notes?: string | null,
    ) => {
      setState((prev) => ({
        ...prev,
        reserving: true,
        error: null,
        lastReservationId: null,
      }));

      try {
        const reservationId = await reserveTool({
          p_tool_asset_id: assetId,
          p_starts_at: startsAt,
          p_ends_at: endsAt,
          p_task_instance_id: null,
          p_notes: notes ?? null,
        });

        const asset =
          state.tools.find((tool) => tool.asset_id === assetId) ?? null;

        const nextReservation: ToolReservationDraft = {
          reservation_id: reservationId,
          asset_id: assetId,
          asset_name: asset?.asset_name ?? "Asset DOMYLI",
          tool_name: asset?.name ?? "Outil DOMYLI",
          starts_at: startsAt,
          ends_at: endsAt,
          notes: notes ?? "",
          status: "RESERVED",
        };

        setState((prev) => ({
          ...prev,
          reserving: false,
          lastReservationId: reservationId,
          reservations: upsertArrayItem(
            prev.reservations,
            (item) => item.reservation_id === reservationId,
            nextReservation,
          ),
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
    [state.tools],
  );

  const releaseToolReservation = useCallback(
    async (reservationId: string, status: string) => {
      setState((prev) => ({
        ...prev,
        releasing: true,
        error: null,
        lastReleaseId: null,
      }));

      try {
        const releasedId = await releaseTool({
          p_reservation_id: reservationId,
          p_status: status,
        });

        setState((prev) => ({
          ...prev,
          releasing: false,
          lastReleaseId: releasedId,
          reservations: prev.reservations.map((item) =>
            item.reservation_id === reservationId
              ? { ...item, status }
              : item,
          ),
        }));

        return releasedId;
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
    [],
  );

  const assets = useMemo<ToolAssetDraft[]>(
    () =>
      state.tools
        .filter((tool) => Boolean(tool.asset_id))
        .map((tool) => ({
          asset_id: tool.asset_id as string,
          tool_id: tool.tool_id,
          tool_name: tool.name,
          category: tool.category,
          asset_name: tool.asset_name,
          asset_status: tool.asset_status,
          asset_notes: tool.asset_notes,
        })),
    [state.tools],
  );

  const openReservations = useMemo(
    () =>
      state.reservations.filter(
        (reservation) =>
          reservation.status !== "RELEASED" &&
          reservation.status !== "CANCELLED",
      ),
    [state.reservations],
  );

  return {
    ...state,
    assets,
    openReservations,
    saveTool,
    reserveToolAsset,
    releaseToolReservation,
  };
}