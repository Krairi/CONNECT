import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/providers/AuthProvider";
import { useHouseholdMembers } from "@/src/hooks/useHouseholdMembers";
import { ROUTES } from "@/src/constants/routes";

const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Member" },
  { value: "PROTECTOR", label: "Protector" },
];

export default function HouseholdMembersPage() {
  const navigate = useNavigate();
  const {
    activeMembership,
    sessionEmail,
    isAuthenticated,
    hasHousehold,
    authLoading,
    bootstrapLoading,
  } = useAuth();

  const { loading, inviting, error, members, lastInviteId, inviteMember } =
    useHouseholdMembers();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const canInvite = useMemo(() => {
    const roleText = (activeMembership?.role ?? "").toUpperCase();
    return (
      roleText === "GARANTOR" ||
      roleText === "GUARANTOR" ||
      roleText === "PROTECTOR"
    );
  }, [activeMembership?.role]);

  if (authLoading || bootstrapLoading || loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          Chargement des membres...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !hasHousehold) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          Foyer requis.
        </div>
      </main>
    );
  }

  const handleInvite = async () => {
    setLocalMessage(null);

    if (!email.trim()) {
      setLocalMessage("L’email du membre est obligatoire.");
      return;
    }

    try {
      const inviteId = await inviteMember(email.trim().toLowerCase(), role);
      setLocalMessage(`Invitation créée : ${inviteId}`);
      setEmail("");
      setRole("MEMBER");
    } catch {
      // erreur gérée par le hook
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center border border-white/10"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-gold">
                DOMYLI
              </p>
              <h1 className="mt-4 text-3xl font-semibold">Membres du foyer</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                Le garant invite un membre dans le foyer. Le membre rejoint
                ensuite le foyer avant l’étape de profil requis.
              </p>
            </div>
          </div>

          {canInvite ? (
            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-2 text-gold">
                <UserPlus className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.24em]">
                  Inviter un membre
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-white/80 md:col-span-2">
                  <span className="mb-2 block">Email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4"
                  />
                </label>

                <label className="block text-sm text-white/80">
                  <span className="mb-2 block">Rôle</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-white/10 bg-black/20 px-4 py-4"
                  >
                    {ROLE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={handleInvite}
                disabled={inviting}
                className="mt-6 inline-flex items-center justify-center gap-3 bg-gold px-6 py-4 text-sm uppercase tracking-[0.24em] text-black disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {inviting ? "Invitation..." : "Inviter"}
              </button>
            </div>
          ) : (
            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6 text-sm text-white/70">
              Seul le garant ou protecteur peut inviter un membre.
            </div>
          )}

          {(localMessage || error || lastInviteId) && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
              {localMessage ??
                error?.message ??
                (lastInviteId ? `Invitation créée : ${lastInviteId}` : null)}
            </div>
          )}
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
            <ShieldCheck className="h-4 w-4" />
            Lecture foyer
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Session
              </p>
              <p className="mt-2 text-sm text-white/85">{sessionEmail ?? "—"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Foyer
              </p>
              <p className="mt-2 text-sm text-white/85">
                {activeMembership?.household_name ?? "—"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="inline-flex items-center gap-2 text-white">
                <Users className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.24em]">Membres</p>
              </div>

              <div className="mt-5 space-y-4">
                {members.length === 0 ? (
                  <p className="text-sm text-white/60">Aucun membre trouvé.</p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.member_user_id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-sm font-medium text-white">
                        {member.member_email ?? member.member_user_id}
                      </p>
                      <p className="mt-2 text-xs text-white/60">
                        {member.role}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-xs text-gold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {member.profile_completed
                          ? `Profil complété : ${member.profile_display_name ?? "Oui"}`
                          : "Profil non complété"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}