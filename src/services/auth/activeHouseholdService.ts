import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type RpcUserActiveHouseholdOutput = {
  active_household_id: string | null;
  household_name: string | null;
  role: string | null;
  plan_tier: string | null;
};

type RawActiveHousehold = {
  active_household_id?: string | null;
  household_id?: string | null;
  household_name?: string | null;
  name?: string | null;
  role?: string | null;
  household_role?: string | null;
  plan_tier?: string | null;
  tier?: string | null;
};

export async function userActiveHousehold(): Promise<RpcUserActiveHouseholdOutput> {
  const rawResult = await callRpc<Record<string, never>, RawActiveHousehold | RawActiveHousehold[]>(
    "rpc_user_active_household",
    {}
  );

  const data = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_user_active_household raw =>", rawResult);
  console.log("DOMYLI rpc_user_active_household normalized =>", data);

  return {
    active_household_id: data?.active_household_id ?? data?.household_id ?? null,
    household_name: data?.household_name ?? data?.name ?? null,
    role: data?.role ?? data?.household_role ?? null,
    plan_tier: data?.plan_tier ?? data?.tier ?? null,
  };
}