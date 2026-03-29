import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type HouseholdMemberItem = {
  member_user_id: string;
  member_email: string | null;
  role: string;
  profile_id: string | null;
  profile_display_name: string | null;
  profile_completed: boolean;
};

type RawHouseholdMemberItem = {
  member_user_id?: string | null;
  member_email?: string | null;
  role?: string | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  profile_completed?: boolean | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

export async function listHouseholdMembers(): Promise<HouseholdMemberItem[]> {
  try {
    const raw = (await callRpc("rpc_household_member_list", {})) as
      | RawHouseholdMemberItem[]
      | RawHouseholdMemberItem
      | null;

    return pickRows(raw).map((row) => ({
      member_user_id: row.member_user_id ?? "",
      member_email: row.member_email ?? null,
      role: row.role ?? "MEMBER",
      profile_id: row.profile_id ?? null,
      profile_display_name: row.profile_display_name ?? null,
      profile_completed: Boolean(row.profile_completed),
    }));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function inviteHouseholdMember(
  email: string,
  role: string,
): Promise<string> {
  try {
    const raw = await callRpc(
      "rpc_household_invite_member",
      {
        p_email: email,
        p_role: role,
        p_expires_at: null,
      },
      { unwrap: true },
    );

    return typeof raw === "string" ? raw : "";
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function acceptHouseholdInvite(token: string): Promise<string> {
  try {
    const raw = await callRpc(
      "rpc_household_invite_accept_v2",
      {
        p_invite_token: token,
      },
      { unwrap: true },
    );

    return typeof raw === "string" ? raw : "";
  } catch (error) {
    throw toDomyliError(error);
  }
}