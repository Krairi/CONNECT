export type CapacityBandCode =
  | "REST"
  | "LIGHT"
  | "BALANCED"
  | "SUSTAINED"
  | "HIGH"
  | "INTENSE"
  | "CUSTOM";

export type CapacityFlow = "TASKS" | "RULES" | "HOUSEHOLD";

export type CapacityBandMeta = {
  code: CapacityBandCode;
  label: string;
  points: number | null;
  description: string;
  readiness: string;
};

export type CapacityRoleLabel = {
  code: string;
  label: string;
};

export const CAPACITY_BAND_METAS: CapacityBandMeta[] = [
  {
    code: "REST",
    label: "Repos / indisponible",
    points: 0,
    description: "Disponibilité quasi nulle pour les efforts du foyer.",
    readiness: "À préserver",
  },
  {
    code: "LIGHT",
    label: "Charge légère",
    points: 3,
    description: "Capacité légère pour petites actions ou continuité minimale.",
    readiness: "Faible charge",
  },
  {
    code: "BALANCED",
    label: "Charge équilibrée",
    points: 5,
    description: "Capacité standard pour maintenir l’exécution du foyer.",
    readiness: "Charge stable",
  },
  {
    code: "SUSTAINED",
    label: "Charge soutenue",
    points: 7,
    description: "Bonne capacité pour absorber plusieurs actions structurées.",
    readiness: "Bonne disponibilité",
  },
  {
    code: "HIGH",
    label: "Charge haute",
    points: 9,
    description: "Capacité élevée pour journées plus denses ou plus exigeantes.",
    readiness: "Forte disponibilité",
  },
  {
    code: "INTENSE",
    label: "Charge intense",
    points: 11,
    description: "Capacité très élevée, à réserver aux journées réellement soutenues.",
    readiness: "Très forte disponibilité",
  },
  {
    code: "CUSTOM",
    label: "Valeur personnalisée",
    points: null,
    description: "Capacité non strictement alignée sur une bande canonique.",
    readiness: "À interpréter",
  },
];

export const CAPACITY_FLOW_LABELS: Record<CapacityFlow, string> = {
  TASKS: "Tâches",
  RULES: "Règles",
  HOUSEHOLD: "Foyer",
};

const ROLE_LABELS: CapacityRoleLabel[] = [
  { code: "GUARANTOR", label: "Garante" },
  { code: "OWNER", label: "Garante" },
  { code: "GARANTE", label: "Garante" },
  { code: "PROTECTOR", label: "Protecteur" },
  { code: "MEMBER", label: "Membre" },
  { code: "CHILD", label: "Enfant" },
];

const ROLE_MAP = new Map(ROLE_LABELS.map((item) => [item.code, item.label]));
const BAND_MAP = new Map(CAPACITY_BAND_METAS.map((item) => [item.code, item]));

export function getCapacityBandOptions() {
  return CAPACITY_BAND_METAS.filter((band) => band.code !== "CUSTOM").map(
    (band) => ({
      value: band.code,
      label: `${band.label}${band.points !== null ? ` · ${band.points} pts` : ""}`,
    })
  );
}

export function getCapacityBandByCode(
  code?: string | null
): CapacityBandMeta | null {
  if (!code) return null;
  return BAND_MAP.get(code as CapacityBandCode) ?? null;
}

export function getCapacityBandFromPoints(
  points?: number | null
): CapacityBandMeta {
  const safePoints = Number(points ?? 0);

  const exact = CAPACITY_BAND_METAS.find(
    (band) => band.points !== null && band.points === safePoints
  );

  if (exact) return exact;

  if (safePoints <= 0) return BAND_MAP.get("REST")!;
  if (safePoints <= 3) return BAND_MAP.get("LIGHT")!;
  if (safePoints <= 5) return BAND_MAP.get("BALANCED")!;
  if (safePoints <= 7) return BAND_MAP.get("SUSTAINED")!;
  if (safePoints <= 9) return BAND_MAP.get("HIGH")!;

  return BAND_MAP.get("INTENSE")!;
}

export function inferCapacityBandCode(
  points?: number | null
): CapacityBandCode {
  const safePoints = Number(points ?? 0);

  const exact = CAPACITY_BAND_METAS.find(
    (band) => band.points !== null && band.points === safePoints
  );

  if (exact) return exact.code;

  return "CUSTOM";
}

export function getCapacityRoleLabel(role?: string | null): string {
  if (!role) return "Membre";

  const normalized = role.trim().toUpperCase();
  return ROLE_MAP.get(normalized) ?? role;
}

export function getCapacityFlowLabel(flow?: string | null): string {
  if (!flow) return "—";
  return CAPACITY_FLOW_LABELS[flow as CapacityFlow] ?? flow;
}

export function getCapacityReadinessTone(points?: number | null): string {
  const band = getCapacityBandFromPoints(points);

  switch (band.code) {
    case "REST":
      return "Préserver / ne pas surcharger";
    case "LIGHT":
      return "Effort léger conseillé";
    case "BALANCED":
      return "Charge normale possible";
    case "SUSTAINED":
      return "Bonne capacité opérationnelle";
    case "HIGH":
      return "Capacité forte disponible";
    case "INTENSE":
      return "Capacité très forte, à utiliser avec discernement";
    default:
      return band.readiness;
  }
}