import { callRpc } from "../rpc";
import { isMissingRpcError } from "../../lib/errors";

export type TeamCapacityInput = {
  p_capacity_date: string;
};

export type TeamCapacityMember = {
  member_user_id: string;
  display_name: string;
  capacity_points_daily: number;
  assigned_points: number;
  remaining_points: number;
};

export type TeamCapacityOutput = {
  household_id: string | null;
  day: string;
  total_capacity_points: number;
  assigned_points: number;
  remaining_points: number;
  members: TeamCapacityMember[];
};

type RawTeamCapacityMember = {
  member_user_id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  capacity_points_daily?: number | null;
  capacity_points?: number | null;
  assigned_points?: number | null;
  remaining_points?: number | null;
};

type RawTeamCapacityJson = {
  household_id?: string | null;
  day?: string | null;
  capacity_date?: string | null;
  total_capacity_points?: number | null;
  total_points?: number | null;
  assigned_points?: number | null;
  remaining_points?: number | null;
  members?: RawTeamCapacityMember[] | null;
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

    return {
      household_id: raw.household_id ?? null,
      day: raw.day ?? raw.capacity_date ?? payload.p_capacity_date,
      total_capacity_points: Number(raw.total_capacity_points ?? raw.total_points ?? 0),
      assigned_points: Number(raw.assigned_points ?? 0),
      remaining_points: Number(raw.remaining_points ?? 0),
      members: Array.isArray(raw.members)
        ? raw.members.map((member) => ({
            member_user_id: member.member_user_id ?? member.user_id ?? "",
            display_name: member.display_name ?? member.full_name ?? "Membre DOMYLI",
            capacity_points_daily: Number(
              member.capacity_points_daily ?? member.capacity_points ?? 0
            ),
            assigned_points: Number(member.assigned_points ?? 0),
            remaining_points: Number(member.remaining_points ?? 0),
          }))
        : [],
    };
  } catch (error) {
    if (isMissingRpcError(error)) {
      return {
        household_id: null,
        day: payload.p_capacity_date,
        total_capacity_points: 0,
        assigned_points: 0,
        remaining_points: 0,
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