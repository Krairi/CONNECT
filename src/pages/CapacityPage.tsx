import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { useCapacity } from "@/src/hooks/useCapacity";
import { ROUTES } from "@/src/constants/routes";
import {
  getCapacityBandByCode,
  getCapacityBandFromPoints,
  getCapacityBandOptions,
  getCapacityReadinessTone,
  getCapacityRoleLabel,
  inferCapacityBandCode,
} from "@/src/constants/capacityCatalog";
import type { CapacityBandCode } from "@/src/constants/capacityCatalog";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function FlowBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center border border-gold/30 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
      {label}
    </span>
  );
}

export default function CapacityPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
    sessionEmail,
    activeMembership,
    bootstrap,
  } = useAuth();

  const [day, setDay] = useState(todayIsoDate());
  const [selectedMemberUserId, setSelectedMemberUserId] = useState("");
  const [capacityPointsDaily, setCapacityPointsDaily] = useState("");
  const [selectedBandCode, setSelectedBandCode] =
    useState<CapacityBandCode>("BALANCED");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const { loading, saving, error, capacity, lastSaved, refresh, saveMemberCapacity } =
    useCapacity(day);

  const bandOptions = useMemo(() => getCapacityBandOptions(), []);

  const selectedMember = useMemo(() => {
    return (
      capacity?.members.find((member) => member.member_user_id === selectedMemberUserId) ??
      null
    );
  }, [capacity?.members, selectedMemberUserId]);

  const averageCapacity = useMemo(() => {
    const membersCount = capacity?.members.length ?? 0;
    if (!membersCount) return 0;

    return Number((capacity?.total_capacity_points ?? 0) / membersCount);
  }, [capacity?.members.length, capacity?.total_capacity_points]);

  const previewPoints = useMemo(() => {
    const parsed = Number(capacityPointsDaily);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [capacityPointsDaily]);

  const previewBand = useMemo(() => {
    const selectedBand = getCapacityBandByCode(selectedBandCode);

    if (selectedBand && selectedBand.points !== null) {
      return selectedBand;
    }

    return getCapacityBandFromPoints(previewPoints);
  }, [selectedBandCode, previewPoints]);

  useEffect(() => {
    if (!selectedMember) return;

    const currentPoints = selectedMember.capacity_points_daily ?? 0;
    setCapacityPointsDaily(String(currentPoints));
    setSelectedBandCode(inferCapacityBandCode(currentPoints));
  }, [selectedMember]);

  if (authLoading || bootstrapLoading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">
            Chargement de la capacité...
          </h1>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-black/40 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">
            DOMYLI
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Foyer requis</h1>
          <p className="mt-4 text-white/70">
            Il faut une session authentifiée et un foyer actif pour accéder à la capacité.
          </p>

          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-8 border border-gold/40 px-6 py-3 text-sm uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Retour à l’accueil
          </button>
        </div>
      </main>
    );
  }

  const handleBandChange = (nextBandCode: CapacityBandCode) => {
    setSelectedBandCode(nextBandCode);
    setLocalMessage(null);

    const band = getCapacityBandByCode(nextBandCode);
    if (band?.points !== null) {
      setCapacityPointsDaily(String(band.points));
    }
  };

  const handleMemberChange = (memberUserId: string) => {
    setSelectedMemberUserId(memberUserId);
    setLocalMessage(null);
  };

  const handleSave = async () => {
    setLocalMessage(null);

    if (!selectedMemberUserId) {
      setLocalMessage("Sélectionne un membre.");
      return;
    }

    if (!capacityPointsDaily.trim()) {
      setLocalMessage("Renseigne une capacité quotidienne.");
      return;
    }

    try {
      const result = await saveMemberCapacity(
        selectedMemberUserId,
        Number(capacityPointsDaily)
      );

      setLocalMessage(
        `Capacité enregistrée : ${result.member_user_id ?? selectedMemberUserId} → ${result.capacity_points_daily ?? capacityPointsDaily} pts`
      );
    } catch {
      // déjà géré dans le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-gold/40"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="mt-6 text-xs uppercase tracking-[0.35em] text-gold/80">
              DOMYLI
            </div>
            <h1 className="mt-3 text-4xl font-semibold">Capacity</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Ici, la capacité n’est pas un simple chiffre libre. C’est une lecture
              gouvernée de la charge soutenable par membre pour piloter les tâches,
              les règles et l’équilibre opérationnel du foyer.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
            <div className="mb-6 flex items-center gap-3 text-gold/85">
              <Gauge className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.35em]">
                Capacité gouvernée
              </span>
            </div>

            <h2 className="text-3xl font-semibold">
              Piloter la charge quotidienne par membre
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-9 text-white/65">
              Sélectionne un membre puis une bande canonique de capacité DOMYLI.
              Tu peux garder les points proposés ou ajuster une valeur personnalisée
              si nécessaire.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Jour
                </label>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Membre
                </label>
                <select
                  value={selectedMemberUserId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  <option value="">Sélectionner un membre</option>
                  {(capacity?.members ?? []).map((member) => {
                    const band = getCapacityBandFromPoints(member.capacity_points_daily);

                    return (
                      <option key={member.member_user_id} value={member.member_user_id}>
                        {getCapacityRoleLabel(member.role)} · {band.label} ·{" "}
                        {member.member_user_id.slice(0, 8)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Bande canonique
                </label>
                <select
                  value={selectedBandCode}
                  onChange={(e) =>
                    handleBandChange(e.target.value as CapacityBandCode)
                  }
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                >
                  {bandOptions.map((band) => (
                    <option key={band.value} value={band.value}>
                      {band.label}
                    </option>
                  ))}
                  <option value="CUSTOM">Valeur personnalisée</option>
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-gold/80">
                  Capacité quotidienne
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={capacityPointsDaily}
                  onChange={(e) => {
                    setCapacityPointsDaily(e.target.value);
                    setSelectedBandCode("CUSTOM");
                    setLocalMessage(null);
                  }}
                  placeholder="5"
                  className="w-full border border-white/10 bg-black/20 px-4 py-4 text-sm outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                {loading ? "Chargement..." : "Rafraîchir"}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer la capacité"}
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {(localMessage || error) && (
              <div className="mt-8 border border-gold/20 bg-gold/10 px-5 py-4 text-lg text-gold">
                {localMessage ?? error?.message}
              </div>
            )}

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.24em] text-gold/75">
                Lecture capacité sélectionnée
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                    Bande
                  </div>
                  <div className="mt-2 text-xl">{previewBand.label}</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                    Points
                  </div>
                  <div className="mt-2 text-xl">{previewPoints}</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                    Lecture DOMYLI
                  </div>
                  <div className="mt-2 text-sm text-white/75">
                    {getCapacityReadinessTone(previewPoints)}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-sm text-white/65">
                {previewBand.description}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <FlowBadge label="Tâches" />
                <FlowBadge label="Règles" />
                <FlowBadge label="Foyer" />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <Users className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Synthèse du jour
                </span>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Email
                  </div>
                  <div className="mt-3 text-2xl">{sessionEmail ?? "—"}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Foyer
                  </div>
                  <div className="mt-3 text-2xl">
                    {activeMembership?.household_name ?? "—"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Total capacité
                  </div>
                  <div className="mt-3 text-3xl">{capacity?.total_capacity_points ?? 0}</div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Moyenne / membre
                  </div>
                  <div className="mt-3 text-3xl">
                    {Number.isFinite(averageCapacity)
                      ? averageCapacity.toFixed(1)
                      : "0.0"}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-gold/75">
                    Membres
                  </div>
                  <div className="mt-3 text-3xl">{capacity?.members.length ?? 0}</div>
                </div>

                {lastSaved && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
                    <div className="flex items-center gap-3 text-gold/85">
                      <Zap className="h-4 w-4" />
                      <span>
                        Dernière capacité enregistrée :{" "}
                        {lastSaved.member_user_id ?? "—"} →{" "}
                        {lastSaved.capacity_points_daily ?? "—"} pts
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 text-white/45">
                <ShieldCheck className="h-4 w-4 text-gold/80" />
                <span className="text-sm">
                  Capacity gouvernée DOMYLI : bande lisible, membre ciblé, charge soutenable.
                </span>
              </div>
            </section>

            <section className="rounded-[2rem] border border-gold/20 bg-black/40 p-8">
              <div className="mb-6 flex items-center gap-3 text-gold/85">
                <Gauge className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">
                  Membres du foyer
                </span>
              </div>

              {(capacity?.members.length ?? 0) === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5 text-white/70">
                  Aucun membre remonté pour ce jour.
                </div>
              ) : (
                <div className="space-y-4">
                  {capacity?.members.map((member) => {
                    const band = getCapacityBandFromPoints(
                      member.capacity_points_daily
                    );
                    const isSelected =
                      member.member_user_id === selectedMemberUserId;

                    return (
                      <div
                        key={member.member_user_id}
                        className={`rounded-[1.5rem] border p-5 ${
                          isSelected
                            ? "border-gold/40 bg-gold/5"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/80">
                              {getCapacityRoleLabel(member.role)}
                            </div>
                            <div className="mt-2 break-all text-sm text-white/85">
                              {member.member_user_id}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleMemberChange(member.member_user_id)}
                            className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-gold/40 hover:text-gold"
                          >
                            Sélectionner
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Capacité
                            </div>
                            <div className="mt-2 text-lg">
                              {member.capacity_points_daily} pts
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-gold/70">
                              Bande
                            </div>
                            <div className="mt-2 text-lg">{band.label}</div>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-white/65">
                          {getCapacityReadinessTone(member.capacity_points_daily)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}