import { callRpc } from "@/src/services/rpc";

export type DashboardViewProfile = {
  profile_id: string;
  display_name: string;
  is_active: boolean;
  is_connectable: boolean;
  member_user_id: string | null;
  birth_date?: string | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  activity_level?: string | null;
  is_pregnant?: boolean;
  has_diabetes?: boolean;
  allergies?: string[];
  food_constraints?: string[];
  cultural_constraints?: string[];
};

export type DashboardViewContext = {
  household_id: string;
  household_name: string;
  role: string | null;
  default_view: "PROFILE" | "FOYER";
  selected_profile_id: string | null;
  selected_profile: DashboardViewProfile | null;
  available_profiles: DashboardViewProfile[];
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapProfile(raw: unknown): DashboardViewProfile | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  return {
    profile_id: String(value.profile_id ?? ""),
    display_name: String(value.display_name ?? ""),
    is_active: Boolean(value.is_active),
    is_connectable: Boolean(value.is_connectable),
    member_user_id:
      typeof value.member_user_id === "string" ? value.member_user_id : null,
    birth_date: typeof value.birth_date === "string" ? value.birth_date : null,
    sex: typeof value.sex === "string" ? value.sex : null,
    height_cm:
      typeof value.height_cm === "number"
        ? value.height_cm
        : value.height_cm == null
          ? null
          : Number(value.height_cm),
    weight_kg:
      typeof value.weight_kg === "number"
        ? value.weight_kg
        : value.weight_kg == null
          ? null
          : Number(value.weight_kg),
    goal: typeof value.goal === "string" ? value.goal : null,
    activity_level:
      typeof value.activity_level === "string" ? value.activity_level : null,
    is_pregnant: Boolean(value.is_pregnant),
    has_diabetes: Boolean(value.has_diabetes),
    allergies: toStringArray(value.allergies),
    food_constraints: toStringArray(value.food_constraints),
    cultural_constraints: toStringArray(value.cultural_constraints),
  };
}

export async function getDashboardViewContext(
  profileId?: string | null,
): Promise<DashboardViewContext> {
  const raw = (await callRpc("rpc_dashboard_view_context", {
    p_profile_id: profileId ?? null,
  }, { unwrap: true })) as Record<string, unknown> | null;

  const selectedProfile = mapProfile(raw?.selected_profile ?? null);

  return {
    household_id: String(raw?.household_id ?? ""),
    household_name: String(raw?.household_name ?? ""),
    role: typeof raw?.role === "string" ? raw.role : null,
    default_view:
      raw?.default_view === "PROFILE" ? "PROFILE" : "FOYER",
    selected_profile_id:
      typeof raw?.selected_profile_id === "string"
        ? raw.selected_profile_id
        : null,
    selected_profile: selectedProfile,
    available_profiles: Array.isArray(raw?.available_profiles)
      ? raw.available_profiles
          .map(mapProfile)
          .filter((profile): profile is DashboardViewProfile => profile !== null)
      : [],
  };
}