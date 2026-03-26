export const ROUTES = {
  home: "/",
  landing: "/",
  dashboard: "/dashboard",
  profiles: "/profiles",
  inventory: "/inventory",
  shopping: "/shopping",
  meals: "/meals",
  tasks: "/tasks",
  capacity: "/capacity",
  tools: "/tools",
  status: "/status",

  recipes: "/recipes",
  pricing: "/pricing",
  subscription: "/subscription",
  selfService: "/self-service",
  integrations: "/integrations",

  admin: "/admin",
  adminHouseholds: "/admin/households",
  adminCatalog: "/admin/catalog",
  adminStatus: "/admin/status",
  adminOverruns: "/admin/overruns",

  notFound: "*",

  HOME: "/",
  LANDING: "/",
  DASHBOARD: "/dashboard",
  PROFILES: "/profiles",
  INVENTORY: "/inventory",
  SHOPPING: "/shopping",
  MEALS: "/meals",
  TASKS: "/tasks",
  CAPACITY: "/capacity",
  TOOLS: "/tools",
  STATUS: "/status",

  RECIPES: "/recipes",
  PRICING: "/pricing",
  SUBSCRIPTION: "/subscription",
  SELF_SERVICE: "/self-service",
  INTEGRATIONS: "/integrations",

  ADMIN: "/admin",
  ADMIN_HOUSEHOLDS: "/admin/households",
  ADMIN_CATALOG: "/admin/catalog",
  ADMIN_STATUS: "/admin/status",
  ADMIN_OVERRUNS: "/admin/overruns",

  NOT_FOUND: "*",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];