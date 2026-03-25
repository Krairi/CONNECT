import { callRpc } from "@/src/services/rpc";

export type RpcHouseholdCreateInput = {
  p_name: string;
};

export type RpcHouseholdCreateOutput = {
  household_id: string;
  household_name: string;
  role: "OWNER";
};

export async function createHousehold(
  payload: RpcHouseholdCreateInput
): Promise<RpcHouseholdCreateOutput> {
  const result = await callRpc<RpcHouseholdCreateOutput>(
    "rpc_household_create",
    payload
  );

  return result!;
}
