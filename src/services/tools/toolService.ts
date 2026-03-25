import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

export type ToolUpsertInput = {
  p_name: string;
  p_category?: string | null;
};

export type ToolUpsertOutput = {
  tool_id: string;
  tool_name: string;
};

type RawToolUpsertOutput = {
  tool_id?: string | null;
  tool_name?: string | null;
  name?: string | null;
};

export type ToolReserveInput = {
  p_tool_asset_id: string;
  p_start_at: string;
  p_end_at: string;
};

export type ToolReserveOutput = {
  reservation_id: string;
  status: string;
};

type RawToolReserveOutput = {
  reservation_id?: string | null;
  status?: string | null;
};

export type ToolReleaseInput = {
  p_tool_reservation_id: string;
};

export type ToolReleaseOutput = {
  reservation_id: string;
  released: boolean;
};

type RawToolReleaseOutput = {
  reservation_id?: string | null;
  released?: boolean | null;
};

export async function upsertTool(
  payload: ToolUpsertInput
): Promise<ToolUpsertOutput> {
  const rawResult = await callRpc<RawToolUpsertOutput | RawToolUpsertOutput[]>(
    "rpc_tool_upsert",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    tool_id: raw?.tool_id ?? "",
    tool_name: raw?.tool_name ?? raw?.name ?? payload.p_name,
  };
}

export async function reserveTool(
  payload: ToolReserveInput
): Promise<ToolReserveOutput> {
  const rawResult = await callRpc<
    RawToolReserveOutput | RawToolReserveOutput[]
  >("rpc_tool_reserve", payload);

  const raw = unwrapRpcRow(rawResult);

  return {
    reservation_id: raw?.reservation_id ?? "",
    status: raw?.status ?? "RESERVED",
  };
}

export async function releaseTool(
  payload: ToolReleaseInput
): Promise<ToolReleaseOutput> {
  const rawResult = await callRpc<
    RawToolReleaseOutput | RawToolReleaseOutput[]
  >("rpc_tool_release", payload);

  const raw = unwrapRpcRow(rawResult);

  return {
    reservation_id: raw?.reservation_id ?? payload.p_tool_reservation_id,
    released: Boolean(raw?.released ?? true),
  };
}