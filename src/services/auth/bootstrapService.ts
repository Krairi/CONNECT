import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

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
  const rawResult = await callRpc<RawBootstrap | RawBootstrap[]>(
    "rpc_user_bootstrap",
    {}
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    user_id: raw?.user_id ?? "",
    active_household_id: raw?.active_household_id ?? null,
    is_super_admin: Boolean(raw?.is_super_admin),
    memberships: Array.isArray(raw?.memberships)
      ? raw.memberships.map((membership) => ({
          household_id: membership.household_id ?? "",
          household_name: membership.household_name ?? "",
          role: membership.role ?? "",
        }))
      : [],
  };
}
