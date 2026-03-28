import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type ToolUpsertInput = {
  p_tool_id?: string | null;
  p_name: string;
  p_category?: string | null;
  p_description?: string | null;
  p_is_active?: boolean | null;
  p_asset_id?: string | null;
  p_asset_name?: string | null;
  p_asset_status?: string | null;
  p_asset_notes?: string | null;
};

export type ToolUpsertOutput = {
  tool_id: string | null;
  asset_id: string | null;
};

type RawToolUpsertOutput = {
  tool_id?: string | null;
  asset_id?: string | null;
};

export type ToolReserveInput = {
  p_tool_asset_id: string;
  p_starts_at: string;
  p_ends_at: string;
  p_task_instance_id?: string | null;
  p_notes?: string | null;
};

export type ToolReleaseInput = {
  p_reservation_id: string;
  p_status?: string | null;
};

function normalizeUuid(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function upsertTool(
  payload: ToolUpsertInput,
): Promise<ToolUpsertOutput> {
  try {
    const rawResult = await callRpc<RawToolUpsertOutput>("rpc_tool_upsert", {
      p_tool_id: payload.p_tool_id ?? null,
      p_name: payload.p_name,
      p_category: payload.p_category ?? null,
      p_description: payload.p_description ?? null,
      p_is_active: payload.p_is_active ?? true,
      p_asset_id: payload.p_asset_id ?? null,
      p_asset_name: payload.p_asset_name ?? null,
      p_asset_status: payload.p_asset_status ?? "AVAILABLE",
      p_asset_notes: payload.p_asset_notes ?? null,
    });

    const raw = rawResult ?? {};

    return {
      tool_id: normalizeUuid(raw.tool_id),
      asset_id: normalizeUuid(raw.asset_id),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function reserveTool(
  payload: ToolReserveInput,
): Promise<string> {
  try {
    const rawResult = await callRpc<string>("rpc_tool_reserve", {
      p_tool_asset_id: payload.p_tool_asset_id,
      p_starts_at: payload.p_starts_at,
      p_ends_at: payload.p_ends_at,
      p_task_instance_id: payload.p_task_instance_id ?? null,
      p_notes: payload.p_notes ?? null,
    });

    return typeof rawResult === "string" ? rawResult : "";
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function releaseTool(
  payload: ToolReleaseInput,
): Promise<string> {
  try {
    const rawResult = await callRpc<string>("rpc_tool_release", {
      p_reservation_id: payload.p_reservation_id,
      p_status: payload.p_status ?? "RELEASED",
    });

    return typeof rawResult === "string" ? rawResult : "";
  } catch (error) {
    throw toDomyliError(error);
  }
}