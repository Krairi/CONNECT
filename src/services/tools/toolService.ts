import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type ToolUpsertInput = {
  p_household_id: string;
  p_tool_id?: string | null;
  p_name: string;
  p_category?: string | null;
};

export type ToolUpsertOutput = {
  tool_id: string;
  tool_key: string;
  updated_at: string;
};

type RawToolUpsertOutput = {
  tool_id?: string | null;
  tool_key?: string | null;
  updated_at?: string | null;
};

export type ToolReserveInput = {
  p_household_id: string;
  p_tool_asset_id: string;
  p_start_at: string;
  p_end_at: string;
};

export type ToolReserveOutput = {
  reservation_id: string;
  status: "RESERVED" | string;
};

type RawToolReserveOutput = {
  reservation_id?: string | null;
  status?: string | null;
};

export type ToolReleaseInput = {
  p_household_id: string;
  p_reservation_id: string;
};

export type ToolReleaseOutput = {
  reservation_id: string;
  status: "RELEASED" | string;
};

type RawToolReleaseOutput = {
  reservation_id?: string | null;
  status?: string | null;
};

export async function upsertTool(payload: ToolUpsertInput): Promise<ToolUpsertOutput> {
  const rawResult = await callRpc<ToolUpsertInput, RawToolUpsertOutput | RawToolUpsertOutput[]>(
    "rpc_tool_upsert",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_tool_upsert raw =>", rawResult);
  console.log("DOMYLI rpc_tool_upsert normalized =>", raw);

  return {
    tool_id: raw?.tool_id ?? "",
    tool_key: raw?.tool_key ?? "",
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}

export async function reserveTool(payload: ToolReserveInput): Promise<ToolReserveOutput> {
  const rawResult = await callRpc<ToolReserveInput, RawToolReserveOutput | RawToolReserveOutput[]>(
    "rpc_tool_reserve",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_tool_reserve raw =>", rawResult);
  console.log("DOMYLI rpc_tool_reserve normalized =>", raw);

  return {
    reservation_id: raw?.reservation_id ?? "",
    status: raw?.status ?? "RESERVED",
  };
}

export async function releaseTool(payload: ToolReleaseInput): Promise<ToolReleaseOutput> {
  const rawResult = await callRpc<ToolReleaseInput, RawToolReleaseOutput | RawToolReleaseOutput[]>(
    "rpc_tool_release",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_tool_release raw =>", rawResult);
  console.log("DOMYLI rpc_tool_release normalized =>", raw);

  return {
    reservation_id: raw?.reservation_id ?? payload.p_reservation_id,
    status: raw?.status ?? "RELEASED",
  };
}