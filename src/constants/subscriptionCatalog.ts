export type PlanCatalogItem = {
  code: "FREE" | "PREMIUM" | "FAMILY";
  label: string;
  tag: string;
  priceLabel: string;
  pitch: string;
  entitlements: {
    max_profiles: number;
    max_inventory_items: number;
    shopping_lists_per_month: number;
    max_members: number;
    max_active_integrations: number;
  };
};

export const SUBSCRIPTION_CATALOG: PlanCatalogItem[] = [
  {
    code: "FREE",
    label: "Free",
    tag: "Découverte",
    priceLabel: "0 € / mois",
    pitch: "Socle initial pour activer le foyer et valider la logique DOMYLI.",
    entitlements: {
      max_profiles: 2,
      max_inventory_items: 50,
      shopping_lists_per_month: 10,
      max_members: 2,
      max_active_integrations: 0,
    },
  },
  {
    code: "PREMIUM",
    label: "Premium",
    tag: "Cœur produit",
    priceLabel: "7,99 € / mois",
    pitch:
      "Le plan cible pour exploiter DOMYLI comme système domestique complet.",
    entitlements: {
      max_profiles: 6,
      max_inventory_items: 300,
      shopping_lists_per_month: -1,
      max_members: 4,
      max_active_integrations: 1,
    },
  },
  {
    code: "FAMILY",
    label: "Family",
    tag: "Extension foyer",
    priceLabel: "Bientôt",
    pitch:
      "Extension future pour foyers plus larges et orchestration renforcée.",
    entitlements: {
      max_profiles: 10,
      max_inventory_items: 600,
      shopping_lists_per_month: -1,
      max_members: 8,
      max_active_integrations: 3,
    },
  },
];

export function formatUnlimited(value: number): string {
  return value < 0 ? "Illimité" : String(value);
}

export function getPlanLabel(code?: string | null): string {
  const normalized = (code ?? "").toUpperCase();
  return (
    SUBSCRIPTION_CATALOG.find((plan) => plan.code === normalized)?.label ??
    normalized ??
    "Plan inconnu"
  );
}