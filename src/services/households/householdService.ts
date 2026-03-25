import { callRpc } from "../rpc";

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
  return callRpc<RpcHouseholdCreateInput, RpcHouseholdCreateOutput>("rpc_household_create", payload);
}
