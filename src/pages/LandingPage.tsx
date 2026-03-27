import { Link } from "react-router-dom";

const VALUE_PILLARS = [
  {
    eyebrow: "Profils",
    title: "Comprendre chaque personne du foyer",
    description:
      "DOMYLI tient compte des préférences, contraintes, objectifs et réalités humaines pour piloter des décisions réellement adaptées.",
  },
  {
    eyebrow: "Orchestration",
    title: "Transformer les besoins en exécution calme",
    description:
      "Repas, tâches, stock, shopping et priorités se relient dans une boucle structurée plutôt que dans des listes dispersées.",
  },
  {
    eyebrow: "Pilotage",
    title: "Voir immédiatement ce qui bloque et quoi faire",
    description:
      "DOMYLI fait émerger les actions prioritaires, les tensions du foyer et les prochaines décisions utiles avec un langage clair.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Le foyer est structuré",
    description:
      "Membres, profils, contraintes et capacités deviennent une base métier exploitable et non de simples informations statiques.",
  },
  {
    step: "02",
    title: "Les décisions deviennent faisables",
    description:
      "Repas et tâches sont reliés au stock, aux outils, à la charge et aux contraintes réelles du foyer.",
  },
  {
    step: "03",
    title: "Le foyer est piloté",
    description:
      "Alertes, priorités, santé du système et prochaines actions remontent dans une console domestique claire et premium.",
  },
] as const;

const PROOF_POINTS = [
  "4 repas par jour pilotés comme un vrai flux métier",
  "Stock, shopping et réintégration reliés à la faisabilité",
  "Tâches, capacité et charge du foyer visibles dans un cockpit unique",
  "Architecture pensée comme un Home OS domestique, pas comme une app de listes",
] as const;

const PLAN_PREVIEW = [
  {
    name: "Free",
    emphasis: "Découverte structurée",
    description: "Structurer le foyer, poser les premiers profils et entrer dans la logique DOMYLI.",
  },
  {
    name: "Premium",
    emphasis: "Pilotage avancé",
    description: "Activer la vraie boucle de valeur : orchestration, visibilité, charge et décisions plus fines.",
    featured: true,
  },
  {
    name: "Family",
    emphasis: "Coordination renforcée",
    description: "Étendre la gouvernance du foyer avec plus de membres, plus de profondeur et plus de pilotage.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="domyli-page-shell overflow-x-hidden">
      <main className="domyli-container relative z-10 flex flex-col gap-10 py-6 sm:gap-14 sm:py-8 lg:gap-16 lg:py-10">
        <section className="domyli-grid-hero">
          <div className="domyli-card domyli-grain relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="domyli-pill domyli-pill-info">Home OS domestique</span>
                  <span className="domyli-pill">Warm Tech</span>
                  <span className="domyli-pill">Pilotage du foyer</span>
                </div>

                <div className="space-y-4">
                  <p className="domyli-eyebrow">DOMYLI • Souveraineté domestique</p>
                  <h1 className="text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-7xl">
                    Transformer le chaos du foyer en <span className="domyli-text-gradient">exécution calme</span>.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">
                    DOMYLI n’est pas une simple application de courses ou de tâches. C’est une interface de pilotage
                    domestique qui relie profils, repas, stock, shopping, charge et exécution dans un même système
                    cohérent.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/dashboard" className="domyli-button-primary">
                    Ouvrir le cockpit DOMYLI
                  </Link>
                  <a href="#how-it-works" className="domyli-button-secondary">
                    Voir la logique produit
                  </a>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {VALUE_PILLARS.map((pillar) => (
                  <div key={pillar.title} className="domyli-card-soft p-4 sm:p-5">
                    <p className="domyli-eyebrow">{pillar.eyebrow}</p>
                    <h2 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{pillar.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="domyli-panel relative overflow-hidden">
              <div className="domyli-grain absolute inset-0" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="domyli-orbit-dot animate-domyli-pulse" />
                  <span className="domyli-eyebrow">Console domestique</span>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
                    Une vue claire du foyer, pas un empilement d’outils.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    DOMYLI donne de la profondeur au quotidien : faisabilité des repas, état du stock, charge réelle,
                    alertes, tâches et prochaines actions se lisent dans un même langage.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="domyli-kpi-card">
                    <p className="domyli-kpi-label">Signal DOMYLI</p>
                    <p className="mt-2 domyli-kpi-value">Cockpit</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      L’interface priorise ce qui aide à décider et non ce qui remplit l’écran.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="domyli-card-soft p-4">
                      <span className="domyli-pill domyli-pill-success">Stock & stabilité</span>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        Voir où le foyer tient, où il manque et quoi corriger sans bruit visuel inutile.
                      </p>
                    </div>
                    <div className="domyli-card-soft p-4">
                      <span className="domyli-pill domyli-pill-warning">Charge & tension</span>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        Identifier les déséquilibres et les blocages avant qu’ils ne deviennent du chaos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="domyli-panel">
              <div className="domyli-panel-header">
                <div>
                  <p className="domyli-eyebrow">Pourquoi DOMYLI</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Une boucle de valeur visible</h3>
                </div>
              </div>

              <div className="space-y-3">
                {PROOF_POINTS.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-white/4 px-4 py-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(59,166,246,0.45)]" />
                    <p className="text-sm leading-6 text-slate-200">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="how-it-works" className="domyli-panel">
          <div className="domyli-panel-header">
            <div className="max-w-2xl">
              <p className="domyli-eyebrow">Comment ça fonctionne</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                DOMYLI relie la décision, la faisabilité et l’exécution.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                Le foyer est structuré, les contraintes deviennent pilotables, puis les repas, les tâches, le stock et
                le shopping s’orchestrent dans un même système.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="domyli-card-soft p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="domyli-pill domyli-pill-info">Étape {item.step}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="domyli-panel">
            <p className="domyli-eyebrow">Signature produit</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Un langage visuel qui exprime la maîtrise, pas la surcharge.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              DOMYLI doit se lire comme une architecture de pilotage domestique : des surfaces calmes, des priorités
              claires, des signaux métiers lisibles et un univers premium cohérent du premier écran au cockpit du
              foyer.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard" className="domyli-button-primary">
                Accéder au dashboard
              </Link>
              <a href="#plans" className="domyli-button-secondary">
                Voir les plans
              </a>
            </div>
          </div>

          <div id="plans" className="grid gap-4 md:grid-cols-3">
            {PLAN_PREVIEW.map((plan) => (
              <div
                key={plan.name}
                className={`domyli-card-soft p-5 sm:p-6 ${
                  plan.featured ? "border-sky-400/25 bg-sky-400/[0.08] shadow-[0_12px_34px_rgba(59,166,246,0.12)]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.04em] text-white">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{plan.emphasis}</p>
                  </div>
                  {plan.featured ? <span className="domyli-pill domyli-pill-info">Plan conseillé</span> : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{plan.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}