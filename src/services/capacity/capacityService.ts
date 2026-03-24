import { callRpc } from "../rpc";
import { isMissingRpcError } from "../../lib/errors";

export type TeamCapacityInput = {
  p_capacity_date: string;
};

export type TeamCapacityMember = {
  member_user_id: string;
  role: string;
  base_capacity_points: number;
  effective_capacity_points: number;
  assigned_effort_points: number;
  remaining_capacity_points: number;
};

export type TeamCapacityOutput = {
  household_id: string | null;
  day: string;
  total_base_capacity_points: number;
  total_effective_capacity_points: number;
  total_assigned_effort_points: number;
  total_remaining_capacity_points: number;
  members: TeamCapacityMember[];
};

type RawTeamCapacityMember = {
  user_id?: string | null;
  role?: string | null;
  base_capacity_points?: number | null;
  effective_capacity_points?: number | null;
  assigned_effort_points?: number | null;
  remaining_capacity_points?: number | null;
};

type RawTeamCapacityJson = {
  household_id?: string | null;
  capacity_date?: string | null;
  members?: RawTeamCapacityMember[] | null;
  totals?: {
    base_capacity_points?: number | null;
    effective_capacity_points?: number | null;
    assigned_effort_points?: number | null;
    remaining_capacity_points?: number | null;
  } | null;
};

export type CapacitySetMemberDailyInput = {
  p_user_id: string;
  p_capacity_date: string;
  p_capacity_points: number;
  p_reason?: string | null;
};

export type CapacitySetMemberDailyOutput = {
  capacity_entry_id: string;
};

export async function getTeamCapacity(
  payload: TeamCapacityInput
): Promise<TeamCapacityOutput> {
  try {
    const rawResult = await callRpc<TeamCapacityInput, RawTeamCapacityJson>(
      "rpc_team_capacity",
      payload
    );

    console.log("DOMYLI rpc_team_capacity raw =>", rawResult);

    const raw = rawResult ?? {};
    const totals = raw.totals ?? {};

    return {
      household_id: raw.household_id ?? null,
      day: raw.capacity_date ?? payload.p_capacity_date,
      total_base_capacity_points: Number(totals.base_capacity_points ?? 0),
      total_effective_capacity_points: Number(totals.effective_capacity_points ?? 0),
      total_assigned_effort_points: Number(totals.assigned_effort_points ?? 0),
      total_remaining_capacity_points: Number(totals.remaining_capacity_points ?? 0),
      members: Array.isArray(raw.members)
        ? raw.members.map((member) => ({
            member_user_id: member.user_id ?? "",
            role: member.role ?? "MEMBRE",
            base_capacity_points: Number(member.base_capacity_points ?? 0),
            effective_capacity_points: Number(member.effective_capacity_points ?? 0),
            assigned_effort_points: Number(member.assigned_effort_points ?? 0),
            remaining_capacity_points: Number(member.remaining_capacity_points ?? 0),
          }))
        : [],
    };
  } catch (error) {
    if (isMissingRpcError(error)) {
      return {
        household_id: null,
        day: payload.p_capacity_date,
        total_base_capacity_points: 0,
        total_effective_capacity_points: 0,
        total_assigned_effort_points: 0,
        total_remaining_capacity_points: 0,
        members: [],
      };
    }
    throw error;
  }
}

export async function setMemberCapacityDaily(
  payload: CapacitySetMemberDailyInput
): Promise<CapacitySetMemberDailyOutput> {
  const rawResult = await callRpc<CapacitySetMemberDailyInput, string>(
    "rpc_capacity_set_member_daily",
    payload
  );

  console.log("DOMYLI rpc_capacity_set_member_daily raw =>", rawResult);

  return {
    capacity_entry_id: rawResult ?? "",
  };
}