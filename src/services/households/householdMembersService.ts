import { isMissingRpcError, toDomyliError } from "@/src/lib/errors";
import { callRpc } from "@/src/services/rpc";
import { readMyProfileStatus } from "@/src/services/profiles/myProfileService";

export type HouseholdMemberItem = {
  member_user_id: string;
  member_email: string | null;
  role: string;
  profile_id: string | null;
  profile_display_name: string | null;
  profile_completed: boolean;
  onboarding_state: string;
};

export type HouseholdInviteCreateResult = {
  invite_id: string;
  invited_email: string;
  role: string;
  workflow_state: string;
  next_step: string;
};

export type HouseholdInviteAcceptResult = {
  accepted: boolean;
  accepted_household_id: string;
  household_id: string;
  active_role: string;
  has_household: boolean;
  has_profile: boolean;
  profile_completed: boolean;
  profile_id: string | null;
  profile_display_name: string | null;
  required_fields: string[];
  workflow_state: string;
  next_route: string;
  can_access_profiled_routes: boolean;
};

type RawHouseholdMemberItem = {
  member_user_id?: string | null;
  member_email?: string | null;
  role?: string | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  profile_completed?: boolean | null;
  onboarding_state?: string | null;
};

type RawHouseholdInviteCreateResult = {
  invite_id?: string | null;
  invited_email?: string | null;
  role?: string | null;
  workflow_state?: string | null;
  next_step?: string | null;
};

type RawHouseholdInviteAcceptResult = {
  accepted?: boolean | null;
  accepted_household_id?: string | null;
  household_id?: string | null;
  active_role?: string | null;
  has_household?: boolean | null;
  has_profile?: boolean | null;
  profile_completed?: boolean | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  required_fields?: string[] | null;
  workflow_state?: string | null;
  next_route?: string | null;
  can_access_profiled_routes?: boolean | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function pickFirst<T>(value: T[] | T | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeMember(row: RawHouseholdMemberItem): HouseholdMemberItem {
  const profileId = row.profile_id ?? null;
  const profileCompleted = Boolean(row.profile_completed);

  return {
    member_user_id: row.member_user_id ?? "",
    member_email: row.member_email ?? null,
    role: (row.role ?? "MEMBER").toUpperCase(),
    profile_id: profileId,
    profile_display_name: row.profile_display_name ?? null,
    profile_completed: profileCompleted,
    onboarding_state:
      row.onboarding_state ??
      (profileId ? (profileCompleted ? "READY" : "PROFILE_INCOMPLETE") : "PROFILE_REQUIRED"),
  };
}

function normalizeInviteCreate(
  row: RawHouseholdInviteCreateResult | null,
  fallbackEmail: string,
  fallbackRole: string,
  fallbackInviteId = "",
): HouseholdInviteCreateResult {
  return {
    invite_id: row?.invite_id ?? fallbackInviteId,
    invited_email: row?.invited_email ?? fallbackEmail,
    role: (row?.role ?? fallbackRole).toUpperCase(),
    workflow_state: row?.workflow_state ?? "INVITED",
    next_step: row?.next_step ?? "WAIT_ACCEPTANCE",
  };
}

function normalizeInviteAccept(
  row: RawHouseholdInviteAcceptResult | null,
  fallbackHouseholdId = "",
  fallbackHasProfile = false,
): HouseholdInviteAcceptResult {
  const requiredFields = Array.isArray(row?.required_fields)
    ? row?.required_fields.filter((item): item is string => typeof item === "string")
    : [];

  const householdId =
    row?.accepted_household_id ??
    row?.household_id ??
    fallbackHouseholdId;

  return {
    accepted: Boolean(row?.accepted ?? householdId),
    accepted_household_id: householdId,
    household_id: row?.household_id ?? householdId,
    active_role: row?.active_role ?? "MEMBER",
    has_household: row?.has_household ?? Boolean(householdId),
    has_profile: row?.has_profile ?? fallbackHasProfile,
    profile_completed: Boolean(row?.profile_completed),
    profile_id: row?.profile_id ?? null,
    profile_display_name: row?.profile_display_name ?? null,
    required_fields: requiredFields,
    workflow_state:
      row?.workflow_state ??
      (fallbackHasProfile ? "READY" : "PROFILE_REQUIRED"),
    next_route:
      row?.next_route ?? (fallbackHasProfile ? "/dashboard" : "/my-profile"),
    can_access_profiled_routes:
      row?.can_access_profiled_routes ?? Boolean(row?.profile_completed),
  };
}

export async function listHouseholdMembers(): Promise<HouseholdMemberItem[]> {
  try {
    const raw = (await callRpc("rpc_household_member_list_v2", {})) as
      | RawHouseholdMemberItem[]
      | RawHouseholdMemberItem
      | null;

    return pickRows(raw).map(normalizeMember);
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      const raw = (await callRpc("rpc_household_member_list", {})) as
        | RawHouseholdMemberItem[]
        | RawHouseholdMemberItem
        | null;

      return pickRows(raw).map(normalizeMember);
    } catch (fallbackError) {
      throw toDomyliError(fallbackError);
    }
  }
}

export async function inviteHouseholdMember(
  email: string,
  role: string,
): Promise<HouseholdInviteCreateResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role.trim().toUpperCase();

  try {
    const raw = (await callRpc(
      "rpc_household_invite_member_v2",
      {
        p_email: normalizedEmail,
        p_role: normalizedRole,
        p_expires_at: null,
      },
      { unwrap: true },
    )) as RawHouseholdInviteCreateResult | RawHouseholdInviteCreateResult[] | null;

    return normalizeInviteCreate(
      pickFirst(raw),
      normalizedEmail,
      normalizedRole,
    );
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      const raw = await callRpc(
        "rpc_household_invite_member",
        {
          p_email: normalizedEmail,
          p_role: normalizedRole,
          p_expires_at: null,
        },
        { unwrap: true },
      );

      return normalizeInviteCreate(
        null,
        normalizedEmail,
        normalizedRole,
        typeof raw === "string" ? raw : "",
      );
    } catch (fallbackError) {
      throw toDomyliError(fallbackError);
    }
  }
}

export async function acceptHouseholdInvite(
  token: string,
): Promise<HouseholdInviteAcceptResult> {
  const normalizedToken = token.trim();

  try {
    const raw = (await callRpc(
      "rpc_household_invite_accept_v3",
      {
        p_invite_token: normalizedToken,
      },
      { unwrap: true },
    )) as RawHouseholdInviteAcceptResult | RawHouseholdInviteAcceptResult[] | null;

    return normalizeInviteAccept(pickFirst(raw));
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      const raw = await callRpc(
        "rpc_household_invite_accept_v2",
        {
          p_invite_token: normalizedToken,
        },
        { unwrap: true },
      );

      const status = await readMyProfileStatus();

      return normalizeInviteAccept(
        {
          accepted: Boolean(raw),
          accepted_household_id: typeof raw === "string" ? raw : "",
          household_id: typeof raw === "string" ? raw : "",
          active_role: status.active_role,
          has_household: status.has_household,
          has_profile: status.has_profile,
          profile_completed: status.profile_completed,
          profile_id: status.profile_id,
          profile_display_name: status.profile_display_name,
          required_fields: status.required_fields,
          workflow_state: status.workflow_state,
          next_route: status.next_route,
          can_access_profiled_routes: status.can_access_profiled_routes,
        },
        typeof raw === "string" ? raw : "",
        status.has_profile,
      );
    } catch (fallbackError) {
      throw toDomyliError(fallbackError);
    }
  }
}
