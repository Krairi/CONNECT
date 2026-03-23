import { callRpc } from "../rpc";

export type RpcUserActiveHouseholdOutput = {
  active_household_id: string | null;
  household_name: string | null;
  role: string | null;
  plan_tier: string | null;
};

export async function userActiveHousehold(): Promise<RpcUserActiveHouseholdOutput> {
  const data = await callRpc<Record<string, never>, RpcUserActiveHouseholdOutput>(
    "rpc_user_active_household",
    {}
  );

  console.log("DOMYLI rpc_user_active_household =>", data);

  return {
    active_household_id: data?.active_household_id ?? null,
    household_name: data?.household_name ?? null,
    role: data?.role ?? null,
    plan_tier: data?.plan_tier ?? null,
  };
}