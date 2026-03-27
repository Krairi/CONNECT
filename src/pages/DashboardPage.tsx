import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";

type PriorityAction = {
  title: string;
  description: string;
  href: string;
  label: string;
};

function getRoleLabel(role?: string | null): string {
  switch ((role ?? "").toUpperCase()) {
    case "GARANTE":
    case "GUARANTOR":
      return "Garante";
    case "PROTECTEUR":
    case "PROTECTOR":
      return "Protecteur";
    case "MEMBRE":
    case "MEMBER":
      return "Membre";
    case "ENFANT":
    case "CHILD":
      return "Enfant";
    default:
      return role?.trim() || "Membre";
  }
}

export default function DashboardPage() {
  const {
    sessionEmail,
    bootstrap,
    activeMembership,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
    error,
  } = useAuth();

  const memberships = bootstrap?.memberships ?? [];
  const membershipCount = memberships.length;
  const activeHouseholdName = activeMembership?.household_name?.trim() || "Foyer DOMYLI";
  const activeRoleLabel = getRoleLabel(activeMembership?.role);
  const isSuperAdmin = Boolean(bootstrap?.is_super_admin);

  const priorityAction = useMemo<PriorityAction>(() => {
    if (!isAuthenticated) {
      return {
        title: "Ouvrir une session DOMYLI",
        description:
          "La connexion permet de relier votre session à votre foyer et d’activer le pilotage réel du quotidien.",
        href: ROUTES.landing,
        label: "Se connecter",
      };
    }

    if (!hasHousehold) {
      return {
        title: "Créer votre premier foyer",
        description:
          "Le foyer est le point d’entrée de toute la logique DOMYLI : profils, repas, tâches, stock et shopping.",
        href: ROUTES.dashboard,
        label: "Créer le foyer",
      };
    }

    return {
      title: "Compléter l’activation métier du foyer",
      description:
        "Ajoutez les profils, initialisez le stock puis lancez les premiers repas et tâches pour entrer dans la boucle de valeur DOMYLI.",
      href: ROUTES.profiles,
      label: "Commencer l’activation",
    };
  }, [hasHousehold, isAuthenticated]);

  const activationItems = useMemo(
    () => [
      {
        label: "Session active",
        done: isAuthenticated,
      },
      {
        label: "Foyer actif",
        done: hasHousehold,
      },
      {
        label: "Memberships visibles",
        done: membershipCount > 0,
      },
      {
        label: "Contexte exploitable",
        done: Boolean(bootstrap?.user_id),
      },
    ],
    [bootstrap?.user_id, hasHousehold, isAuthenticated, membershipCount],
  );

  const activationScore = activationItems.filter((item) => item.done).length;
  const activationMax = activationItems.length;

  if (authLoading || bootstrapLoading) {
    return (
      <div className="domyli-page-shell">
        <div className="domyli-container py-6 sm:py-8 lg:py-10">
          <div className="domyli-loading-state">
            <span className="domyli-eyebrow">DOMYLI • Chargement du cockpit</span>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
              Le foyer est en cours de synchronisation.
            </h1>
            <p className="text-sm leading-6 text-slate-300">
              DOMYLI rassemble votre session, votre contexte foyer et vos informations d’accès pour afficher un
              cockpit cohérent et exploitable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="domyli-page-shell">
        <div className="domyli-container py-6 sm:py-8 lg:py-10">
          <div className="domyli-error-state">
            <span className="domyli-eyebrow">DOMYLI • Cockpit indisponible</span>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
              Le cockpit du foyer n’a pas pu être chargé correctement.
            </h1>
            <p className="text-sm leading-6 text-slate-300">
              Vérifie la session, le bootstrap utilisateur et le foyer actif, puis recharge l’interface.
            </p>

            <div className="domyli-alert domyli-alert-danger">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200/85">
                Diagnostic
              </p>
              <p className="mt-2 text-sm leading-6 text-red-50/90">
                {error.message || "Une erreur DOMYLI a interrompu le chargement du cockpit."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className="domyli-button-primary" onClick={() => window.location.reload()}>
                Recharger
              </button>
              <Link to={ROUTES.landing} className="domyli-button-secondary">
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
                  <span className={hasHousehold ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                    {hasHousehold ? "Foyer actif" : "Foyer à créer"}
                  </span>
                  <span className="domyli-pill domyli-pill-info">Cockpit DOMYLI</span>
                  {isSuperAdmin ? <span className="domyli-pill">Super Admin</span> : null}
                </div>

                <div className="space-y-4">
                  <p className="domyli-eyebrow">Pilotage du foyer</p>
                  <h1 className="text-balance text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-6xl">
                    Une console claire pour structurer, activer et faire monter le foyer en valeur.
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                    DOMYLI rassemble votre contexte de session, votre foyer actif et vos prochaines actions utiles dans
                    une interface calme, structurée et premium.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="domyli-kpi-card">
                  <p className="domyli-kpi-label">Score d’activation</p>
                  <p className="mt-2 domyli-kpi-value">
                    {activationScore}/{activationMax}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Mesure simple de progression du contexte DOMYLI vers un foyer exploitable.
                  </p>
                </div>

                <div className="domyli-kpi-card">
                  <p className="domyli-kpi-label">Memberships</p>
                  <p className="mt-2 domyli-kpi-value">{membershipCount}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Nombre de rattachements foyer détectés dans votre bootstrap utilisateur.
                  </p>
                </div>

                <div className="domyli-kpi-card">
                  <p className="domyli-kpi-label">Rôle actif</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                    {activeRoleLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Niveau d’accès actuellement appliqué sur le foyer actif.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Action prioritaire</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                    {priorityAction.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-300">{priorityAction.description}</p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link to={priorityAction.href} className="domyli-button-primary">
                  {priorityAction.label}
                </Link>
                <Link to={ROUTES.status} className="domyli-button-secondary">
                  Ouvrir Status
                </Link>
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Lecture immédiate</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Contexte actif</h2>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Email session</span>
                  <span className="max-w-[60%] truncate text-right font-medium text-white">
                    {sessionEmail || "Non connecté"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">Foyer actif</span>
                  <span className="max-w-[60%] truncate text-right font-medium text-white">
                    {hasHousehold ? activeHouseholdName : "Aucun foyer actif"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                  <span className="text-sm text-slate-300">User ID bootstrap</span>
                  <span className="max-w-[60%] truncate text-right font-medium text-white">
                    {bootstrap?.user_id || "Indisponible"}
                  </span>
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
                  <p className="domyli-eyebrow">Progression d’activation</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                    Le foyer entre dans la boucle DOMYLI
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {activationItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-4"
                  >
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className={item.done ? "domyli-pill domyli-pill-success" : "domyli-pill domyli-pill-warning"}>
                      {item.done ? "OK" : "À faire"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Pages cœur produit</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                    Les prochaines zones à activer
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-info">Profiles</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
                    Intelligence humaine
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    C’est ici que DOMYLI comprend les personnes du foyer et leurs contraintes réelles.
                  </p>
                  <div className="mt-4">
                    <Link to={ROUTES.profiles} className="domyli-button-secondary">
                      Ouvrir Profiles
                    </Link>
                  </div>
                </div>

                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-warning">Inventory</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
                    Gouvernance du stock
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Le stock rend les décisions repas et shopping réellement pilotables.
                  </p>
                  <div className="mt-4">
                    <Link to={ROUTES.inventory} className="domyli-button-secondary">
                      Ouvrir Inventory
                    </Link>
                  </div>
                </div>

                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill domyli-pill-success">Meals</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
                    Orchestration alimentaire
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    La planification repas prend de la valeur dès que profils et stock sont en place.
                  </p>
                  <div className="mt-4">
                    <Link to={ROUTES.meals} className="domyli-button-secondary">
                      Ouvrir Meals
                    </Link>
                  </div>
                </div>

                <div className="domyli-card-soft p-5">
                  <span className="domyli-pill">Tasks</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
                    Exécution domestique
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Les tâches structurent la charge réelle du foyer et sa coordination.
                  </p>
                  <div className="mt-4">
                    <Link to={ROUTES.tasks} className="domyli-button-secondary">
                      Ouvrir Tasks
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Raccourcis métier</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Accès rapides</h2>
                </div>
              </div>

              <div className="grid gap-3">
                <Link to={ROUTES.profiles} className="domyli-button-secondary justify-between">
                  <span>Profiles</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to={ROUTES.inventory} className="domyli-button-secondary justify-between">
                  <span>Inventory</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to={ROUTES.shopping} className="domyli-button-secondary justify-between">
                  <span>Shopping</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to={ROUTES.meals} className="domyli-button-secondary justify-between">
                  <span>Meals</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to={ROUTES.tasks} className="domyli-button-secondary justify-between">
                  <span>Tasks</span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link to={ROUTES.status} className="domyli-button-secondary justify-between">
                  <span>Status</span>
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Cap sur la suite</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                    Ce que doit devenir ce cockpit
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                <div className="domyli-alert domyli-alert-info">
                  <p className="text-sm leading-6 text-slate-200">
                    À ce stade, le dashboard doit d’abord être stable, lisible et connecté au vrai contrat auth/foyer.
                  </p>
                </div>
                <div className="domyli-alert domyli-alert-warning">
                  <p className="text-sm leading-6 text-slate-200">
                    Ensuite seulement, on enrichit avec KPI métier, activation réelle, alertes fines et automatisation.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}