import { callRpc } from "@/src/services/rpc";

export type TeamCapacityMember = {
  member_user_id: string;
  role: string;
  capacity_points_daily: number;
};

export type TeamCapacity = {
  day: string | null;
  household_id: string | null;
  total_capacity_points: number;
  members: TeamCapacityMember[];
};

type RawTeamCapacityMember = {
  member_user_id?: string | null;
  user_id?: string | null;
  role?: string | null;
  capacity_points_daily?: number | null;
};

type RawTeamCapacity =
  | {
      day?: string | null;
      household_id?: string | null;
      total_capacity_points?: number | null;
      total_points?: number | null;
      members?: RawTeamCapacityMember[] | null;
    }
  | RawTeamCapacityMember[]
  | null;

type RawCapacitySetOutput = {
  member_user_id?: string | null;
  user_id?: string | null;
  capacity_points_daily?: number | null;
};

export type CapacitySetResult = {
  member_user_id: string | null;
  capacity_points_daily: number | null;
};

export async function getTeamCapacity(
  p_day: string
): Promise<TeamCapacity> {
  const raw = await callRpc<RawTeamCapacity>(
    "rpc_team_capacity",
    { p_day },
    { unwrap: false }
  );

  const isArrayResponse = Array.isArray(raw);

  const members = isArrayResponse
    ? raw
    : Array.isArray(raw?.members)
    ? raw.members
    : [];

  return {
    day: isArrayResponse ? p_day : raw?.day ?? p_day,
    household_id: isArrayResponse ? null : raw?.household_id ?? null,
    total_capacity_points: Number(
      isArrayResponse ? 0 : raw?.total_capacity_points ?? raw?.total_points ?? 0
    ),
    members: members.map((member) => ({
      member_user_id: member.member_user_id ?? member.user_id ?? "",
      role: member.role ?? "MEMBER",
      capacity_points_daily: Number(member.capacity_points_daily ?? 0),
    })),
  };
}

export async function setMemberCapacityDaily(
  memberUserId: string,
  capacityPointsDaily: number
): Promise<CapacitySetResult> {
  const raw = await callRpc<RawCapacitySetOutput | null>(
    "rpc_capacity_set_member_daily",
    {
      p_member_user_id: memberUserId,
      p_capacity_points_daily: capacityPointsDaily,
    },
    { unwrap: true }
  );

  return {
    member_user_id: raw?.member_user_id ?? raw?.user_id ?? memberUserId,
    capacity_points_daily:
      raw?.capacity_points_daily ?? capacityPointsDaily,
  };
}