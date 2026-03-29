import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookMarked,
  CookingPot,
  Lock,
  Save,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useCatalog } from "@/src/hooks/useCatalog";
import { ROUTES } from "@/src/constants/routes";
import { getTaskFlowLabel } from "@/src/constants/taskCatalog";

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70">
      {label}
    </span>
  );
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : "Une erreur est survenue.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

export default function AdminCatalogPage() {
  const navigate = useNavigate();
  const {
    bootstrap,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
    activeMembership,
  } = useAuth();

  const {
    loading,
    saving,
    error,
    recipes,
    taskTemplates,
    saveRecipe,
    lastSavedRecipeId,
  } = useCatalog();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isSuperAdmin = Boolean(bootstrap?.is_super_admin);

  const recipePreview = useMemo(() => recipes.slice(0, 8), [recipes]);
  const taskPreview = useMemo(() => taskTemplates.slice(0, 8), [taskTemplates]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <p className="text-xs uppercase tracking-[0.32em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Chargement du cockpit catalogue...
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/20">
              <Lock className="h-6 w-6 text-white/80" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Accès restreint
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Session requise
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Il faut une session authentifiée pour accéder au cockpit catalogue.
            </p>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              Retour à l’accueil
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isSuperAdmin) {
    return (
      <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/20">
              <Lock className="h-6 w-6 text-white/80" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Accès restreint
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Cockpit Super Admin
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Cette surface de gouvernance catalogue est réservée au Super Admin
              DOMYLI.
            </p>
            <button
              onClick={() =>
                navigate(hasHousehold ? ROUTES.DASHBOARD : ROUTES.HOME)
              }
              className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              {hasHousehold ? "Retour au dashboard" : "Retour à l’accueil"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalMessage(null);

    try {
      const recipeId = await saveRecipe({
        p_title: title,
        p_description: description,
        p_instructions: instructions,
        p_is_active: isActive,
      });

      setLocalMessage(
        recipeId
          ? `Recette catalogue enregistrée : ${recipeId}`
          : "Recette catalogue enregistrée.",
      );

      setTitle("");
      setDescription("");
      setInstructions("");
      setIsActive(true);
    } catch (saveError) {
      setLocalMessage(getErrorMessage(saveError));
    }
  };

  return (
    <main className="min-h-screen bg-obsidian px-6 py-10 text-alabaster">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <button
              onClick={() =>
                navigate(hasHousehold ? ROUTES.DASHBOARD : ROUTES.HOME)
              }
              className="mb-6 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              DOMYLI
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Admin Catalog
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              Socle de gouvernance catalogue : publication de recettes côté back,
              prévisualisation structurée des templates de tâches côté produit.
            </p>
          </div>

          <div className="rounded-3xl border border-gold/20 bg-gold/10 px-5 py-4 text-right">
            <div className="inline-flex items-center gap-2 text-gold">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">
                Super Admin
              </span>
            </div>
            <p className="mt-2 text-sm text-gold/90">
              {hasHousehold
                ? activeMembership?.household_name ?? "Foyer actif"
                : "Cockpit global sans foyer requis"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                <CookingPot className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  Catalogue recette
                </p>
                <p className="mt-1 text-sm text-white/65">
                  Publication contrôlée par le cockpit Super Admin.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Titre de recette</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Instructions</span>
                  <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    rows={8}
                    className="w-full resize-none border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Publier immédiatement la recette
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-3 border border-gold bg-gold px-5 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer dans le catalogue"}
              </button>

              {(localMessage || error?.message) && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
                  {localMessage ?? error?.message}
                </div>
              )}

              {lastSavedRecipeId ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
                  Dernière recette persistée : {lastSavedRecipeId}
                </div>
              ) : null}
            </form>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <CookingPot className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Recettes publiées
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {recipePreview.length === 0 ? (
                    <p className="text-sm text-white/60">
                      Aucune recette publiée.
                    </p>
                  ) : (
                    recipePreview.map((recipe) => (
                      <div
                        key={recipe.recipe_id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {recipe.title}
                        </p>
                        <p className="mt-2 text-xs text-white/60">
                          {recipe.description || "Description non renseignée."}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 text-white">
                  <Wrench className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Socle templates de tâches
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {taskPreview.map((task) => (
                    <div
                      key={task.code}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-sm font-medium text-white">
                        {task.label}
                      </p>
                      <p className="mt-2 text-xs text-white/60">
                        {task.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.flows.map((flow) => (
                          <FlowBadge
                            key={`${task.code}-${flow}`}
                            label={getTaskFlowLabel(flow)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-5">
                <div className="inline-flex items-center gap-2 text-gold">
                  <BookMarked className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.24em]">
                    Lecture système
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-gold/90">
                  Le catalogue recette est gouverné côté base et visible côté
                  utilisateur. Le socle de tâches reste structuré côté produit
                  pour préparer le prochain build Tasks.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}