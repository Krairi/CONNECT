import { isMissingRpcError, toDomyliError } from "@/src/lib/errors";
import { callRpc } from "@/src/services/rpc";
import { listHouseholdMembers } from "@/src/services/households/householdMembersService";

export type HouseholdProfileReadinessItem = {
  member_user_id: string;
  member_email: string | null;
  role: string;
  profile_id: string | null;
  profile_display_name: string | null;
  profile_completed: boolean;
  onboarding_state: string;
  readiness_score: number;
};

type RawHouseholdProfileReadinessItem = {
  member_user_id?: string | null;
  member_email?: string | null;
  role?: string | null;
  profile_id?: string | null;
  profile_display_name?: string | null;
  profile_completed?: boolean | null;
  onboarding_state?: string | null;
  readiness_score?: number | null;
};

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function normalizeItem(
  row: RawHouseholdProfileReadinessItem,
): HouseholdProfileReadinessItem {
  const onboardingState = row.onboarding_state ?? "PROFILE_REQUIRED";
  const readinessScore =
    typeof row.readiness_score === "number"
      ? row.readiness_score
      : onboardingState === "READY"
        ? 100
        : onboardingState === "PROFILE_INCOMPLETE"
          ? 50
          : 0;

  return {
    member_user_id: row.member_user_id ?? "",
    member_email: row.member_email ?? null,
    role: (row.role ?? "MEMBER").toUpperCase(),
    profile_id: row.profile_id ?? null,
    profile_display_name: row.profile_display_name ?? null,
    profile_completed: Boolean(row.profile_completed),
    onboarding_state: onboardingState,
    readiness_score: readinessScore,
  };
}

export async function listHouseholdProfileReadiness(): Promise<
  HouseholdProfileReadinessItem[]
> {
  try {
    const raw = (await callRpc("rpc_household_profile_readiness_list_v1", {})) as
      | RawHouseholdProfileReadinessItem[]
      | RawHouseholdProfileReadinessItem
      | null;

    return pickRows(raw).map(normalizeItem);
  } catch (error) {
    if (!isMissingRpcError(error)) {
      throw toDomyliError(error);
    }

    try {
      const members = await listHouseholdMembers();

      return members.map((member) => ({
        member_user_id: member.member_user_id,
        member_email: member.member_email,
        role: member.role,
        profile_id: member.profile_id,
        profile_display_name: member.profile_display_name,
        profile_completed: member.profile_completed,
        onboarding_state: member.onboarding_state,
        readiness_score:
          member.onboarding_state === "READY"
            ? 100
            : member.onboarding_state === "PROFILE_INCOMPLETE"
              ? 50
              : 0,
      }));
    } catch (fallbackError) {
      throw toDomyliError(fallbackError);
    }
  }
}
