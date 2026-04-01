
import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

type RpcObject = Record<string, unknown>;

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

async function callRpcFallback<T>(names: string[], payload: RpcObject, options: RpcObject = {}): Promise<T> {
  let lastError: unknown = null;
  for (const name of names) {
    try {
      return (await callRpc(name, payload, options as never)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function svgDataUri(title: string, subtitle: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1200" y2="720" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1B2735"/>
          <stop offset="1" stop-color="#090A0F"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#g)"/>
      <circle cx="940" cy="160" r="180" fill="#D4AF37" fill-opacity="0.16"/>
      <circle cx="280" cy="600" r="220" fill="#FFFFFF" fill-opacity="0.05"/>
      <rect x="96" y="96" width="1008" height="528" rx="36" fill="#FFFFFF" fill-opacity="0.04" stroke="#FFFFFF" stroke-opacity="0.10"/>
      <text x="140" y="290" fill="#D4AF37" font-size="24" font-family="Arial, sans-serif" letter-spacing="6">${subtitle}</text>
      <text x="140" y="360" fill="#FFFFFF" font-size="52" font-weight="700" font-family="Arial, sans-serif">${title}</text>
      <text x="140" y="430" fill="#B8C1CC" font-size="26" font-family="Arial, sans-serif">Lecture détaillée intelligente · Bibliothèque tâches DOMYLI</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getZoneImage(zoneCode: string, title: string): string {
  switch (zoneCode) {
    case "KITCHEN":
      return svgDataUri(title, "Cuisine gouvernée");
    case "BATHROOM":
      return svgDataUri(title, "Salle de bain gouvernée");
    case "LAUNDRY":
      return svgDataUri(title, "Buanderie gouvernée");
    case "LIVING_ROOM":
      return svgDataUri(title, "Salon gouverné");
    default:
      return svgDataUri(title, "DOMYLI");
  }
}

export type TaskLibraryBadge = {
  code: string;
  label: string;
};

export type TaskLibraryTool = {
  tool_code: string;
  tool_label: string;
};

export type TaskChecklistItem = {
  check_code: string;
  label: string;
  sort_order: number;
};

export type TaskCompatibilityTag = {
  code: string;
  label: string;
};

export type TaskLibraryItem = {
  task_template_code: string;
  title: string;
  short_description: string;
  zone_code: string;
  zone_label: string;
  family_code: string;
  family_label: string;
  task_type_code: string;
  task_type_label: string;
  frequency_code: string;
  frequency_label: string;
  difficulty_code: string;
  difficulty_label: string;
  effort_code: string;
  effort_label: string;
  estimated_duration_minutes: number;
  publication_status: string;
  proof_type_code: string;
  proof_type_label: string;
  image_url: string | null;
  image_alt: string;
  hero_badges: TaskLibraryBadge[];
  compatibility_tags: TaskCompatibilityTag[];
  fit_status: string;
  fit_reasons: string[];
  blocked_reasons: string[];
};

export type TaskLibraryDetail = TaskLibraryItem & {
  required_tools: TaskLibraryTool[];
  checklist_items: TaskChecklistItem[];
  execution_signals: TaskLibraryBadge[];
  detail_context: string;
  selected_profile_id: string | null;
};

function normalizeBadges(value: unknown): TaskLibraryBadge[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const item = (entry ?? {}) as RpcObject;
      return {
        code: typeof item.code === "string" ? item.code : "",
        label: typeof item.label === "string" ? item.label : "",
      };
    })
    .filter((entry) => entry.code || entry.label);
}

function normalizeTools(value: unknown): TaskLibraryTool[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const item = (entry ?? {}) as RpcObject;
      return {
        tool_code: typeof item.tool_code === "string" ? item.tool_code : "",
        tool_label: typeof item.tool_label === "string" ? item.tool_label : "Outil",
      };
    })
    .filter((entry) => entry.tool_code || entry.tool_label);
}

function normalizeChecklist(value: unknown): TaskChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      const item = (entry ?? {}) as RpcObject;
      return {
        check_code:
          typeof item.check_code === "string"
            ? item.check_code
            : `CHECK_${String(index + 1).padStart(2, "0")}`,
        label: typeof item.label === "string" ? item.label : "Étape DOMYLI",
        sort_order: Number(item.sort_order ?? index + 1),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizeItem(raw: RpcObject): TaskLibraryItem {
  const zoneCode = typeof raw.zone_code === "string" ? raw.zone_code : "HOME";
  const title = typeof raw.title === "string" ? raw.title : "Tâche DOMYLI";
  const imageUrl =
    typeof raw.image_url === "string" && raw.image_url.trim()
      ? raw.image_url
      : getZoneImage(zoneCode, title);

  return {
    task_template_code:
      typeof raw.task_template_code === "string" ? raw.task_template_code : "",
    title,
    short_description:
      typeof raw.short_description === "string"
        ? raw.short_description
        : "Tâche publiée et gouvernée par DOMYLI.",
    zone_code: zoneCode,
    zone_label:
      typeof raw.zone_label === "string" ? raw.zone_label : "Foyer",
    family_code:
      typeof raw.family_code === "string" ? raw.family_code : "GENERAL",
    family_label:
      typeof raw.family_label === "string" ? raw.family_label : "Général",
    task_type_code:
      typeof raw.task_type_code === "string" ? raw.task_type_code : "STANDARD",
    task_type_label:
      typeof raw.task_type_label === "string" ? raw.task_type_label : "Standard",
    frequency_code:
      typeof raw.frequency_code === "string" ? raw.frequency_code : "ON_DEMAND",
    frequency_label:
      typeof raw.frequency_label === "string" ? raw.frequency_label : "À la demande",
    difficulty_code:
      typeof raw.difficulty_code === "string" ? raw.difficulty_code : "EASY",
    difficulty_label:
      typeof raw.difficulty_label === "string" ? raw.difficulty_label : "Facile",
    effort_code:
      typeof raw.effort_code === "string" ? raw.effort_code : "LIGHT",
    effort_label:
      typeof raw.effort_label === "string" ? raw.effort_label : "Effort léger",
    estimated_duration_minutes: Number(raw.estimated_duration_minutes ?? 0),
    publication_status:
      typeof raw.publication_status === "string" ? raw.publication_status : "PUBLISHED",
    proof_type_code:
      typeof raw.proof_type_code === "string" ? raw.proof_type_code : "PHOTO_AFTER",
    proof_type_label:
      typeof raw.proof_type_label === "string" ? raw.proof_type_label : "Preuve standard",
    image_url: imageUrl,
    image_alt:
      typeof raw.image_alt === "string" ? raw.image_alt : `Illustration ${title}`,
    hero_badges: normalizeBadges(raw.hero_badges),
    compatibility_tags: normalizeBadges(raw.compatibility_tags),
    fit_status: typeof raw.fit_status === "string" ? raw.fit_status : "HOUSEHOLD",
    fit_reasons: Array.isArray(raw.fit_reasons)
      ? raw.fit_reasons.filter((value): value is string => typeof value === "string")
      : [],
    blocked_reasons: Array.isArray(raw.blocked_reasons)
      ? raw.blocked_reasons.filter((value): value is string => typeof value === "string")
      : [],
  };
}

function normalizeDetail(raw: RpcObject): TaskLibraryDetail {
  const item = normalizeItem(raw);

  return {
    ...item,
    required_tools: normalizeTools(raw.required_tools),
    checklist_items: normalizeChecklist(raw.checklist_items),
    execution_signals: normalizeBadges(raw.execution_signals),
    detail_context:
      typeof raw.detail_context === "string" ? raw.detail_context : "HOUSEHOLD",
    selected_profile_id:
      typeof raw.selected_profile_id === "string" ? raw.selected_profile_id : null,
  };
}

export async function readTaskLibrary(input: {
  zoneCode?: string | null;
  frequencyCode?: string | null;
  profileId?: string | null;
  limit?: number;
} = {}): Promise<TaskLibraryItem[]> {
  try {
    const raw = await callRpcFallback<unknown[]>(
      ["rpc_task_library_list_v2", "rpc_task_library_list_v1"],
      {
        p_zone_code: input.zoneCode ?? null,
        p_frequency_code: input.frequencyCode ?? null,
        p_profile_id: input.profileId ?? null,
        p_limit: input.limit ?? 64,
      },
      { timeoutMs: 12_000, retries: 1, retryDelayMs: 800 },
    );

    return pickRows(raw)
      .map((row) => normalizeItem((row ?? {}) as RpcObject))
      .filter((row) => Boolean(row.task_template_code))
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readTaskLibraryDetail(input: {
  taskTemplateCode: string;
  contextCode?: string | null;
  profileId?: string | null;
}): Promise<TaskLibraryDetail> {
  try {
    const raw = await callRpcFallback<RpcObject | null>(
      ["rpc_task_library_read_v1"],
      {
        p_task_template_code: input.taskTemplateCode,
        p_context_code: input.contextCode ?? null,
        p_profile_id: input.profileId ?? null,
      },
      { unwrap: true, timeoutMs: 12_000, retries: 1, retryDelayMs: 800 },
    );

    return normalizeDetail((raw ?? {}) as RpcObject);
  } catch (error) {
    throw toDomyliError(error);
  }
}
