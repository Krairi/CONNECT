import { callRpc } from "@/src/services/rpc";
import { unwrapRpcRow } from "@/src/services/unwrapRpcRow";

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

type RawCapacitySetMemberDailyOutput = {
  capacity_entry_id?: string | null;
};

export async function getTeamCapacity(
  payload: TeamCapacityInput
): Promise<TeamCapacityOutput> {
  const rawResult = await callRpc<RawTeamCapacityJson | RawTeamCapacityJson[]>(
    "rpc_team_capacity",
    payload
  );

  const raw = unwrapRpcRow(rawResult);

  return {
    day: raw?.day ?? raw?.capacity_date ?? payload.p_capacity_date,
    total_capacity_points: Number(raw?.total_capacity_points ?? raw?.total_points ?? 0),
    assigned_points: Number(raw?.assigned_points ?? 0),
    remaining_points: Number(raw?.remaining_points ?? 0),
    members: Array.isArray(raw?.members)
      ? raw.members.map((member) => ({
          member_user_id: member.member_user_id ?? member.user_id ?? "",
          display_name: member.display_name ?? member.full_name ?? "Membre DOMYLI",
          capacity_points_daily: Number(member.capacity_points_daily ?? member.capacity_points ?? 0),
          assigned_points: Number(member.assigned_points ?? 0),
          remaining_points: Number(member.remaining_points ?? 0),
        }))
      : [],
  };
}

export async function setMemberCapacityDaily(
  payload: CapacitySetMemberDailyInput
): Promise<CapacitySetMemberDailyOutput> {
  const rawResult = await callRpc<
    RawCapacitySetMemberDailyOutput | RawCapacitySetMemberDailyOutput[]
  >("rpc_capacity_set_member_daily", payload);

  const raw = unwrapRpcRow(rawResult);

  return {
    capacity_entry_id: raw?.capacity_entry_id ?? "",
  };
}
