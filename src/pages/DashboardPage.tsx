import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useStatus } from "../hooks/useStatus";
import useDashboard from "../hooks/useDashboard";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function firstDefined<T>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

function severityClass(severity: string) {
  switch (severity) {
    case "critical":
    case "danger":
      return "domyli-pill domyli-pill-danger";
    case "warning":
    case "attention":
      return "domyli-pill domyli-pill-warning";
    case "success":
    case "ok":
      return "domyli-pill domyli-pill-success";
    default:
      return "domyli-pill domyli-pill-info";
  }
}

export default function DashboardPage() {
  const dashboardState = useDashboard() as unknown as UnknownRecord;
  const statusState = useStatus() as unknown as UnknownRecord;

  const dashboardPayload = useMemo(() => {
    return asRecord(firstDefined(dashboardState.data, dashboardState.dashboard, dashboardState.payload, dashboardState.summary));
  }, [dashboardState]);

  const statusPayload = useMemo(() => {
    return asRecord(firstDefined(statusState.data, statusState.status, statusState.payload, statusState.summary));
  }, [statusState]);

  const activationPayload = useMemo(() => {
    return asRecord(firstDefined(statusPayload.activation, dashboardPayload.activation, dashboardPayload.activation_status));
  }, [dashboardPayload, statusPayload]);

  const valueChainPayload = useMemo(() => {
    return asRecord(firstDefined(statusPayload.valueChain, statusPayload.value_chain, dashboardPayload.value_chain_status));
  }, [dashboardPayload, statusPayload]);

  const alerts = useMemo(() => {
    const alertSource =
      firstDefined(
        dashboardPayload.alerts,
        dashboardPayload.critical_alerts,
        statusPayload.alerts,
        statusPayload.items,
      ) ?? [];
    return asArray(alertSource)
      .map((item) => asRecord(item))
      .slice(0, 4)
      .map((item) => ({
        title: asString(firstDefined(item.title, item.label, item.name), "Alerte DOMYLI"),
        description: asString(
          firstDefined(item.description, item.message, item.subtitle),
          "Un signal métier nécessite une vérification du foyer.",
        ),
        severity: asString(firstDefined(item.severity, item.level, item.status), "info").toLowerCase(),
      }));
  }, [dashboardPayload, statusPayload]);

  const mealsToday = asNumber(
    firstDefined(
      dashboardPayload.meals_today,
      dashboardPayload.today_meals_count,
      dashboardPayload.mealsCount,
      valueChainPayload.meal_slots_count,
    ),
    0,
  );

  const tasksToday = asNumber(
    firstDefined(
      dashboardPayload.tasks_today,
      dashboardPayload.today_tasks_count,
      dashboardPayload.tasksCount,
      valueChainPayload.task_instances_count,
    ),
    0,
  );

  const openAlertsCount = asNumber(
    firstDefined(
      dashboardPayload.alerts_open_count,
      dashboardPayload.open_alerts_count,
      valueChainPayload.alerts_open_count,
      alerts.length,
    ),
    alerts.length,
  );

  const shoppingOpenCount = asNumber(
    firstDefined(
      dashboardPayload.shopping_open_count,
      valueChainPayload.shopping_open_count,
    ),
    0,
  );

  const inventoryCount = asNumber(
    firstDefined(
      dashboardPayload.inventory_items_count,
      valueChainPayload.inventory_items_count,
    ),
    0,
  );

  const profilesCount = asNumber(
    firstDefined(
      dashboardPayload.profiles_count,
      valueChainPayload.profiles_count,
    ),
    0,
  );

  const membersCount = asNumber(
    firstDefined(
      dashboardPayload.members_count,
      valueChainPayload.members_count,
    ),
    0,
  );

  const activationScore = asNumber(
    firstDefined(
      activationPayload.activation_score,
      dashboardPayload.activation_score,
    ),
    0,
  );

  const isOperational = asBoolean(
    firstDefined(
      activationPayload.is_operational,
      dashboardPayload.is_operational,
    ),
    false,
  );

  const hasProfiles = asBoolean(
    firstDefined(
      activationPayload.has_profiles,
      dashboardPayload.has_profiles,
    ),
    profilesCount > 0,
  );

  const hasInventory = asBoolean(
    firstDefined(
      activationPayload.has_inventory,
      dashboardPayload.has_inventory,
    ),
    inventoryCount > 0,
  );

  const hasTasks = asBoolean(
    firstDefined(
      activationPayload.has_tasks,
      dashboardPayload.has_tasks,
    ),
    tasksToday > 0,
  );

  const nextAction = useMemo(() => {
    if (!membersCount) {
      return {
        title: "Créer et activer le foyer",
        description: "DOMYLI a besoin d’un foyer opérationnel pour piloter profils, repas, tâches et stock.",
        href: "/dashboard",
        label: "Activer le foyer",
      };
    }

    if (!hasProfiles) {
      return {
        title: "Compléter les profils humains",
        description: "Les profils sont la base de l’adaptation repas, tâches et décisions de faisabilité.",
        href: "/profiles",
        label: "Ouvrir Profiles",
      };
    }

    if (!hasInventory) {
      return {
        title: "Initialiser le stock utile",
        description: "Le cockpit DOMYLI devient vraiment utile quand le stock commence à refléter la réalité du foyer.",
        href: "/inventory",
        label: "Ouvrir Inventory",
      };
    }

    if (!hasTasks) {
      return {
        title: "Activer les premières tâches",
        description: "Le pilotage domestique devient concret quand une première charge exécutable apparaît dans le foyer.",
        href: "/tasks",
        label: "Ouvrir Tasks",
      };
    }

    if (shoppingOpenCount > 0) {
      return {
        title: "Traiter les besoins shopping ouverts",
        description: "Des besoins sont déjà détectés. Les corriger améliore immédiatement la faisabilité du foyer.",
        href: "/shopping",
        label: "Ouvrir Shopping",
      };
    }

    if (openAlertsCount > 0) {
      return {
        title: "Traiter les alertes prioritaires",
        description: "Le cockpit signale des tensions qui méritent une correction avant qu’elles ne dégradent le foyer.",
        href: "/status",
        label: "Voir les alertes",
      };
    }

    return {
      title: "Continuer le pilotage du foyer",
      description: "Le foyer est engagé dans la boucle DOMYLI. Vous pouvez affiner repas, tâches, stock et charge.",
      href: "/dashboard",
      label: "Rester sur le cockpit",
    };
  }, [hasInventory, hasProfiles, hasTasks, membersCount, openAlertsCount, shoppingOpenCount]);

  const loading = asBoolean(firstDefined(dashboardState.isLoading, statusState.isLoading), false);
  const hasError = Boolean(firstDefined(dashboardState.error, statusState.error));

  if (loading) {
    return (
      <div className="domyli-page-shell">
        <div className="domyli-container py-6 sm:py-8 lg:py-10">
          <div className="domyli-loading-state">
            <span className="domyli-eyebrow">DOMYLI • Chargement du cockpit</span>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
              Le foyer est en cours de synchronisation.
            </h1>
            <p className="text-sm leading-6 text-slate-300">
              DOMYLI rassemble les signaux utiles pour afficher un cockpit cohérent, priorisé et lisible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="domyli-page-shell">
        <div className="domyli-container py-6 sm:py-8 lg:py-10">
          <div className="domyli-error-state">
            <span className="domyli-eyebrow">DOMYLI • Cockpit indisponible</span>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
              Le tableau de pilotage n’a pas pu être chargé correctement.
            </h1>
            <p className="text-sm leading-6 text-slate-300">
              Vérifiez votre session, votre foyer actif ou la disponibilité du backend, puis rechargez le cockpit.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className="domyli-button-primary" onClick={() => window.location.reload()}>
                Recharger
              </button>
              <Link to="/" className="domyli-button-secondary">
                Revenir à l’accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="domyli-page-shell">
      <div className="domyli-container flex flex-col gap-6 py-6 sm:gap-7 sm:py-8 lg:gap-8 lg:py-10">
        <section className="domyli-grid-hero">
          <div className="domyli-card domyli-grain relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={isOperational ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                    {isOperational ? "Foyer opérationnel" : "Activation en cours"}
                  </span>
                  <span className="domyli-pill domyli-pill-info">Cockpit DOMYLI</span>
                </div>

                <div className="space-y-4">
                  <p className="domyli-eyebrow">Pilotage du foyer</p>
                  <h1 className="text-balance text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-6xl">
                    Une console claire pour voir ce qui bloque, ce qui tient et ce qu’il faut faire maintenant.
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                    DOMYLI réunit vos profils, vos repas, vos tâches, votre stock, vos besoins shopping et vos
                    signaux critiques dans un même centre de décision domestique.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="domyli-kpi-card">
                  <p className="domyli-kpi-label">Score d’activation</p>
                  <p className="mt-2 domyli-kpi-value">{activationScore}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Mesure de progression vers un foyer pleinement pilotable.</p>
                </div>
                <div className="domyli-kpi-card">
                  <p className="domyli-kpi-label">Repas du jour</p>
                  <p className="mt-2 domyli-kpi-value">{mealsToday}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Décisions alimentaires visibles dans la console DOMYLI.</p>
                </div>
                <div className="domyli-kpi-card">
                  <p className="domyli-kpi-label">Tâches du jour</p>
                  <p className="mt-2 domyli-kpi-value">{tasksToday}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Exécution domestique lisible, assignable et pilotable.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Action prioritaire</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{nextAction.title}</h2>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-300">{nextAction.description}</p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link to={nextAction.href} className="domyli-button-primary">
                  {nextAction.label}
                </Link>
                <Link to="/status" className="domyli-button-secondary">
                  Voir la santé du foyer
                </Link>
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">État du foyer</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Lecture immédiate</h2>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Membres</span>
                  <span className="font-semibold text-white">{membersCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Profils</span>
                  <span className="font-semibold text-white">{profilesCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Articles de stock</span>
                  <span className="font-semibold text-white">{inventoryCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Besoins shopping ouverts</span>
                  <span className="font-semibold text-white">{shoppingOpenCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Alertes actives</span>
                  <span className="font-semibold text-white">{openAlertsCount}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5">
            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Vue du jour</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Ce que DOMYLI met en avant</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-info">Repas</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">Planification alimentaire</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Vérifiez rapidement si le foyer dispose d’un volume de repas suffisant et passez à la correction si la
                    faisabilité commence à se tendre.
                  </p>
                  <div className="mt-4">
                    <Link to="/meals" className="domyli-button-secondary">
                      Ouvrir Meals
                    </Link>
                  </div>
                </div>

                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-success">Tâches</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">Exécution domestique</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Visualisez les tâches actives, les blocages et la charge du jour pour répartir l’effort avec plus de clarté.
                  </p>
                  <div className="mt-4">
                    <Link to="/tasks" className="domyli-button-secondary">
                      Ouvrir Tasks
                    </Link>
                  </div>
                </div>

                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-warning">Stock</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">Signal inventaire</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Gardez une vue immédiate de l’état du stock et de ce qui doit être réapprovisionné avant de perturber la boucle.
                  </p>
                  <div className="mt-4">
                    <Link to="/inventory" className="domyli-button-secondary">
                      Ouvrir Inventory
                    </Link>
                  </div>
                </div>

                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-danger">Alertes</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">Santé du système</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Quand le foyer décroche, DOMYLI doit vous dire pourquoi, à quel niveau et quelle action réduit la tension.
                  </p>
                  <div className="mt-4">
                    <Link to="/status" className="domyli-button-secondary">
                      Ouvrir Status
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Activation</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">Progression du foyer</h2>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">Profils configurés</span>
                    <span className={hasProfiles ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                      {hasProfiles ? "Oui" : "À compléter"}
                    </span>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">Inventaire initialisé</span>
                    <span className={hasInventory ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                      {hasInventory ? "Oui" : "À initier"}
                    </span>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">Premières tâches actives</span>
                    <span className={hasTasks ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                      {hasTasks ? "Oui" : "À lancer"}
                    </span>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">Foyer opérationnel</span>
                    <span className={isOperational ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                      {isOperational ? "Oui" : "En progression"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Alertes critiques</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Ce qui demande votre attention</h2>
                </div>
              </div>

              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div key={`${alert.title}-${index}`} className="domyli-alert domyli-alert-danger">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <span className={severityClass(alert.severity)}>{alert.severity || "info"}</span>
                          <h3 className="text-sm font-semibold text-white sm:text-base">{alert.title}</h3>
                          <p className="text-sm leading-6 text-slate-300">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="domyli-alert domyli-alert-info">
                    <p className="text-sm leading-6 text-slate-200">
                      Aucun signal critique n’est remonté pour le moment. Le foyer reste dans une zone de stabilité utile.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Link to="/status" className="domyli-button-secondary">
                  Voir tous les signaux
                </Link>
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Raccourcis métier</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Accès rapides</h2>
                </div>
              </div>

              <div className="grid gap-3">
                <Link to="/profiles" className="domyli-button-secondary justify-between">
                  <span>Profiles</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to="/inventory" className="domyli-button-secondary justify-between">
                  <span>Inventory</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to="/shopping" className="domyli-button-secondary justify-between">
                  <span>Shopping</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to="/meals" className="domyli-button-secondary justify-between">
                  <span>Meals</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to="/tasks" className="domyli-button-secondary justify-between">
                  <span>Tasks</span>
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}