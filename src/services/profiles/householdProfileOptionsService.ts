import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

export type HouseholdProfileOption = {
  profile_id: string;
  display_name: string;
  summary: string;
  is_linked: boolean;
  updated_at: string | null;
};

type RawHouseholdProfileOption = {
  profile_id?: string | null;
  display_name?: string | null;
  summary?: string | null;
  is_linked?: boolean | null;
  updated_at?: string | null;
};

function normalizeRows(
  value:
    | RawHouseholdProfileOption
    | RawHouseholdProfileOption[]
    | null
    | undefined,
): RawHouseholdProfileOption[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

export async function listHouseholdProfileOptions(): Promise<
  HouseholdProfileOption[]
> {
  try {
    const raw = (await callRpc("rpc_human_profiles_list", {}, {
      unwrap: true,
      timeoutMs: 12_000,
      retries: 1,
      retryDelayMs: 900,
    })) as
      | RawHouseholdProfileOption
      | RawHouseholdProfileOption[]
      | null;

    return normalizeRows(raw)
      .filter((row) => typeof row.profile_id === "string" && row.profile_id.trim())
      .map((row) => ({
        profile_id: row.profile_id ?? "",
        display_name: row.display_name?.trim() || "Profil sans nom",
        summary: row.summary?.trim() || row.display_name?.trim() || "Profil DOMYLI",
        is_linked: Boolean(row.is_linked),
        updated_at: row.updated_at ?? null,
      }));
  } catch (error) {
    throw toDomyliError(error);
  }
}