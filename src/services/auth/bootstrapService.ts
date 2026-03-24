import { callRpc } from "../rpc";
import { unwrapRpcRow } from "../unwrapRpcRow";

export type DomyliHouseholdRole =
  | "GARANTE"
  | "PROTECTEUR"
  | "MEMBRE"
  | "ENFANT"
  | "OWNER"
  | "PROTECTOR"
  | "MEMBER"
  | "CHILD";

export type RpcUserBootstrapOutput = {
  user_id: string;
  active_household_id: string | null;
  is_super_admin: boolean;
  memberships: Array<{
    household_id: string;
    household_name: string;
    role: DomyliHouseholdRole | string;
  }>;
};

type RawBootstrap = {
  user_id?: string | null;
  active_household_id?: string | null;
  is_super_admin?: boolean | null;
  memberships?: Array<{
    household_id?: string | null;
    household_name?: string | null;
    role?: string | null;
  }> | null;
};

export async function userBootstrap(): Promise<RpcUserBootstrapOutput> {
  const rawResult = await callRpc<Record<string, never>, RawBootstrap | RawBootstrap[]>(
    "rpc_user_bootstrap",
    {}
  );

  const raw = unwrapRpcRow(rawResult);

  console.log("DOMYLI rpc_user_bootstrap raw =>", rawResult);
  console.log("DOMYLI rpc_user_bootstrap normalized =>", raw);

  return {
    user_id: raw?.user_id ?? "",
    active_household_id: raw?.active_household_id ?? null,
    is_super_admin: Boolean(raw?.is_super_admin),
    memberships: Array.isArray(raw?.memberships)
      ? raw!.memberships.map((membership) => ({
          household_id: membership.household_id ?? "",
          household_name: membership.household_name ?? "",
          role: membership.role ?? "",
        }))
      : [],
  };
}