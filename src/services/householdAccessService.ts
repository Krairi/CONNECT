import { supabase } from "@/src/lib/supabase";

export type HouseholdAccessProfile = {
  profile_id: string;
  display_name: string;
  is_active: boolean;
  is_connectable: boolean;
};

export type HouseholdAccessEnterResponse = {
  household_id: string;
  household_name: string;
  access_code: string;
  session_limit: number;
  open_session_count: number;
  profiles: HouseholdAccessProfile[];
};

export type HouseholdSessionOpenResponse = {
  session_id: string;
  session_key: string;
  household_id: string;
  household_name: string;
  profile_id: string;
  profile_name: string;
  reused: boolean;
};

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Erreur DOMYLI inconnue.";
}

export async function enterHouseholdByAccessCode(
  accessCode: string,
): Promise<HouseholdAccessEnterResponse> {
  const normalizedCode = accessCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("L’identifiant foyer est requis.");
  }

  const { data, error } = await supabase
    .schema("app")
    .rpc("rpc_household_access_enter", {
      p_access_code: normalizedCode,
    });

  if (error) {
    throw new Error(toMessage(error));
  }

  return data as HouseholdAccessEnterResponse;
}

export async function openHouseholdProfileSession(input: {
  accessCode: string;
  profileId: string;
  deviceLabel?: string | null;
}): Promise<HouseholdSessionOpenResponse> {
  const { accessCode, profileId, deviceLabel } = input;

  if (!accessCode.trim()) {
    throw new Error("L’identifiant foyer est requis.");
  }

  if (!profileId.trim()) {
    throw new Error("Le profil humain est requis.");
  }

  const { data, error } = await supabase
    .schema("app")
    .rpc("rpc_household_session_open", {
      p_access_code: accessCode.trim().toUpperCase(),
      p_profile_id: profileId.trim(),
      p_device_label: deviceLabel ?? "web",
    });

  if (error) {
    throw new Error(toMessage(error));
  }

  const payload = data as HouseholdSessionOpenResponse;

  localStorage.setItem("domyli.householdSessionKey", payload.session_key);
  localStorage.setItem("domyli.householdId", payload.household_id);
  localStorage.setItem("domyli.profileId", payload.profile_id);

  return payload;
}

export async function closeHouseholdProfileSession(): Promise<boolean> {
  const sessionKey = localStorage.getItem("domyli.householdSessionKey");

  if (!sessionKey) {
    return false;
  }

  const { data, error } = await supabase
    .schema("app")
    .rpc("rpc_household_session_close", {
      p_session_key: sessionKey,
    });

  if (error) {
    throw new Error(toMessage(error));
  }

  const ok =
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    Boolean((data as { ok?: unknown }).ok);

  localStorage.removeItem("domyli.householdSessionKey");
  localStorage.removeItem("domyli.householdId");
  localStorage.removeItem("domyli.profileId");

  return ok;
}