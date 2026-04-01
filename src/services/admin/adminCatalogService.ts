import { callRpc } from "@/src/services/rpc";
import { toDomyliError } from "@/src/lib/errors";

type RpcObject = Record<string, unknown>;

function pickRows<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

export type PublicationStatus = "ALL" | "DRAFT" | "VALIDATED" | "PUBLISHED" | "DEPRECATED" | "ARCHIVED";

export type AdminCatalogSummaryBucket = {
  total: number;
  published: number;
  draft: number;
  validated: number;
  archived: number;
};

export type AdminCatalogSummary = {
  recipes: AdminCatalogSummaryBucket;
  tasks: AdminCatalogSummaryBucket;
};

export type AdminRecipeCatalogItem = {
  recipe_id: string;
  recipe_code: string;
  title: string;
  short_description: string;
  description: string;
  publication_status: PublicationStatus;
  prep_minutes: number;
  cook_minutes: number;
  default_servings: number;
  difficulty: string;
  image_url: string | null;
  image_alt: string;
  tags: { code: string; label: string }[];
  meal_types: string[];
  instruction_steps: { step_code: string; label: string; sort_order: number }[];
  hero_badges: { code: string; label: string }[];
  detail_readiness: string;
  admin_updated_at: string | null;
};

export type AdminTaskCatalogItem = {
  task_template_code: string;
  title: string;
  short_description: string;
  publication_status: PublicationStatus;
  zone_code: string;
  zone_label: string;
  family_code: string;
  family_label: string;
  frequency_code: string;
  frequency_label: string;
  difficulty_code: string;
  difficulty_label: string;
  effort_code: string;
  effort_label: string;
  estimated_duration_minutes: number;
  image_url: string | null;
  image_alt: string;
  required_tools: { tool_code: string; tool_label: string }[];
  checklist_items: { check_code: string; label: string; sort_order: number }[];
  compatibility_tags: { code: string; label: string }[];
  hero_badges: { code: string; label: string }[];
  proof_type_code: string;
  proof_type_label: string;
  admin_updated_at: string | null;
};

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
      <circle cx="960" cy="140" r="180" fill="#D4AF37" fill-opacity="0.16"/>
      <circle cx="240" cy="600" r="220" fill="#FFFFFF" fill-opacity="0.05"/>
      <rect x="96" y="96" width="1008" height="528" rx="36" fill="#FFFFFF" fill-opacity="0.04" stroke="#FFFFFF" stroke-opacity="0.10"/>
      <text x="140" y="292" fill="#F8F8F6" font-family="Arial, sans-serif" font-size="58" font-weight="700">${title}</text>
      <text x="140" y="354" fill="#D4AF37" font-family="Arial, sans-serif" font-size="26" letter-spacing="5">${subtitle}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeTags(value: unknown): { code: string; label: string }[] {
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function normalizeSteps(value: unknown): { step_code: string; label: string; sort_order: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      const item = (entry ?? {}) as RpcObject;
      return {
        step_code: typeof item.step_code === "string" ? item.step_code : `STEP_${String(index + 1).padStart(2, "0")}`,
        label: typeof item.label === "string" ? item.label : "Étape DOMYLI",
        sort_order: Number(item.sort_order ?? index + 1),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizeChecklist(value: unknown): { check_code: string; label: string; sort_order: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      const item = (entry ?? {}) as RpcObject;
      return {
        check_code: typeof item.check_code === "string" ? item.check_code : `CHECK_${String(index + 1).padStart(2, "0")}`,
        label: typeof item.label === "string" ? item.label : "Contrôle DOMYLI",
        sort_order: Number(item.sort_order ?? index + 1),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizeSummaryBucket(value: unknown): AdminCatalogSummaryBucket {
  const item = (value ?? {}) as RpcObject;
  return {
    total: Number(item.total ?? 0),
    published: Number(item.published ?? 0),
    draft: Number(item.draft ?? 0),
    validated: Number(item.validated ?? 0),
    archived: Number(item.archived ?? 0),
  };
}

function normalizeRecipeItem(raw: RpcObject): AdminRecipeCatalogItem {
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title : "Recette DOMYLI";
  const imageUrl = typeof raw.image_url === "string" && raw.image_url.trim()
    ? raw.image_url
    : svgDataUri(title, "Bibliothèque recette · Super Admin");

  return {
    recipe_id: typeof raw.recipe_id === "string" ? raw.recipe_id : "",
    recipe_code: typeof raw.recipe_code === "string" ? raw.recipe_code : "",
    title,
    short_description:
      typeof raw.short_description === "string" && raw.short_description.trim()
        ? raw.short_description
        : "Recette gouvernée DOMYLI.",
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description
        : "Recette gouvernée DOMYLI.",
    publication_status: ((typeof raw.publication_status === "string" ? raw.publication_status : "PUBLISHED").toUpperCase() as PublicationStatus),
    prep_minutes: Number(raw.prep_minutes ?? 0),
    cook_minutes: Number(raw.cook_minutes ?? 0),
    default_servings: Number(raw.default_servings ?? 1),
    difficulty: typeof raw.difficulty === "string" ? raw.difficulty : "EASY",
    image_url: imageUrl,
    image_alt: typeof raw.image_alt === "string" ? raw.image_alt : `Visuel ${title}`,
    tags: normalizeTags(raw.tags),
    meal_types: normalizeStringArray(raw.meal_types),
    instruction_steps: normalizeSteps(raw.instruction_steps),
    hero_badges: normalizeTags(raw.hero_badges),
    detail_readiness: typeof raw.detail_readiness === "string" ? raw.detail_readiness : "BASE",
    admin_updated_at: typeof raw.admin_updated_at === "string" ? raw.admin_updated_at : null,
  };
}

function normalizeTaskItem(raw: RpcObject): AdminTaskCatalogItem {
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title : "Tâche DOMYLI";
  const imageUrl = typeof raw.image_url === "string" && raw.image_url.trim()
    ? raw.image_url
    : svgDataUri(title, "Bibliothèque tâche · Super Admin");

  return {
    task_template_code: typeof raw.task_template_code === "string" ? raw.task_template_code : "",
    title,
    short_description:
      typeof raw.short_description === "string" && raw.short_description.trim()
        ? raw.short_description
        : "Tâche gouvernée DOMYLI.",
    publication_status: ((typeof raw.publication_status === "string" ? raw.publication_status : "PUBLISHED").toUpperCase() as PublicationStatus),
    zone_code: typeof raw.zone_code === "string" ? raw.zone_code : "HOME",
    zone_label: typeof raw.zone_label === "string" ? raw.zone_label : "Foyer",
    family_code: typeof raw.family_code === "string" ? raw.family_code : "GENERAL",
    family_label: typeof raw.family_label === "string" ? raw.family_label : "Général",
    frequency_code: typeof raw.frequency_code === "string" ? raw.frequency_code : "ON_DEMAND",
    frequency_label: typeof raw.frequency_label === "string" ? raw.frequency_label : "À la demande",
    difficulty_code: typeof raw.difficulty_code === "string" ? raw.difficulty_code : "EASY",
    difficulty_label: typeof raw.difficulty_label === "string" ? raw.difficulty_label : "Facile",
    effort_code: typeof raw.effort_code === "string" ? raw.effort_code : "LIGHT",
    effort_label: typeof raw.effort_label === "string" ? raw.effort_label : "Effort léger",
    estimated_duration_minutes: Number(raw.estimated_duration_minutes ?? 0),
    image_url: imageUrl,
    image_alt: typeof raw.image_alt === "string" ? raw.image_alt : `Visuel ${title}`,
    required_tools: normalizeTags(raw.required_tools).map((tool) => ({ tool_code: tool.code, tool_label: tool.label })),
    checklist_items: normalizeChecklist(raw.checklist_items),
    compatibility_tags: normalizeTags(raw.compatibility_tags),
    hero_badges: normalizeTags(raw.hero_badges),
    proof_type_code: typeof raw.proof_type_code === "string" ? raw.proof_type_code : "PHOTO_AFTER",
    proof_type_label: typeof raw.proof_type_label === "string" ? raw.proof_type_label : "Preuve DOMYLI",
    admin_updated_at: typeof raw.admin_updated_at === "string" ? raw.admin_updated_at : null,
  };
}

export async function readAdminCatalogSummary(): Promise<AdminCatalogSummary> {
  try {
    const raw = (await callRpc("rpc_admin_catalog_summary_v1", {}, { schema: "app" })) as RpcObject;
    return {
      recipes: normalizeSummaryBucket(raw.recipes),
      tasks: normalizeSummaryBucket(raw.tasks),
    };
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readAdminRecipeCatalog(params: {
  publicationStatus?: PublicationStatus;
  search?: string | null;
  limit?: number;
}): Promise<AdminRecipeCatalogItem[]> {
  try {
    const raw = (await callRpc("rpc_admin_recipe_catalog_list_v1", {
      p_publication_status: params.publicationStatus ?? "ALL",
      p_search: params.search ?? null,
      p_limit: params.limit ?? 240,
    }, { schema: "app" })) as unknown;
    return pickRows<RpcObject>(raw).map(normalizeRecipeItem);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function readAdminTaskCatalog(params: {
  publicationStatus?: PublicationStatus;
  search?: string | null;
  limit?: number;
}): Promise<AdminTaskCatalogItem[]> {
  try {
    const raw = (await callRpc("rpc_admin_task_catalog_list_v1", {
      p_publication_status: params.publicationStatus ?? "ALL",
      p_search: params.search ?? null,
      p_limit: params.limit ?? 240,
    }, { schema: "app" })) as unknown;
    return pickRows<RpcObject>(raw).map(normalizeTaskItem);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function setAdminRecipePublicationStatus(recipeId: string, publicationStatus: Exclude<PublicationStatus, "ALL">): Promise<AdminRecipeCatalogItem> {
  try {
    const raw = (await callRpc("rpc_admin_recipe_publication_set_v1", {
      p_recipe_id: recipeId,
      p_publication_status: publicationStatus,
    }, { schema: "app" })) as RpcObject;
    return normalizeRecipeItem(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}

export async function setAdminTaskPublicationStatus(taskTemplateCode: string, publicationStatus: Exclude<PublicationStatus, "ALL">): Promise<AdminTaskCatalogItem> {
  try {
    const raw = (await callRpc("rpc_admin_task_publication_set_v1", {
      p_task_template_code: taskTemplateCode,
      p_publication_status: publicationStatus,
    }, { schema: "app" })) as RpcObject;
    return normalizeTaskItem(raw);
  } catch (error) {
    throw toDomyliError(error);
  }
}
