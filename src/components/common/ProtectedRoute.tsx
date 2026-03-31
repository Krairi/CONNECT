import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, Link } from "react-router-dom";

import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/constants/routes";
import { readMyProfileStatus } from "@/src/services/profiles/myProfileService";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";

type Props = {
  children: ReactNode;
  requireHousehold?: boolean;
  requireSuperAdmin?: boolean;
  allowSuperAdminBypassHousehold?: boolean;
  requireProfile?: boolean;
};

type ProfileGateState = {
  loading: boolean;
  checked: boolean;
  hasProfile: boolean;
  error: DomyliAppError | null;
};

const initialProfileGate: ProfileGateState = {
  loading: false,
  checked: false,
  hasProfile: false,
  error: null,
};

function getAuthenticatedFallbackRoute(hasHousehold: boolean): string {
  return hasHousehold ? ROUTES.DASHBOARD : ROUTES.ACTIVATE_HOUSEHOLD;
}

function GateScreen({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  onSecondaryClick,
}: {
  title: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
}) {
  return (
    <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
      <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">DOMYLI</p>
        <h1 className="mt-4 text-3xl font-semibold">{title}</h1>

        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            {description}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {primaryLabel && primaryHref ? (
            <Link
              to={primaryHref}
              className="inline-flex items-center justify-center border border-gold/40 px-5 py-3 text-sm uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
            >
              {primaryLabel}
            </Link>
          ) : null}

          {secondaryLabel && onSecondaryClick ? (
            <button
              type="button"
              onClick={onSecondaryClick}
              className="inline-flex items-center justify-center border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:border-gold/40 hover:text-gold"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  requireHousehold = false,
  requireSuperAdmin = false,
  allowSuperAdminBypassHousehold = false,
  requireProfile = false,
}: Props) {
  const {
    authLoading,
    bootstrapLoading,
    isAuthenticated,
    hasHousehold,
    bootstrap,
  } = useAuth();

  const isSuperAdmin = Boolean(bootstrap?.is_super_admin);
  const canBypassHousehold = allowSuperAdminBypassHousehold && isSuperAdmin;
  const activeHouseholdId = bootstrap?.active_household_id ?? null;

  const mustCheckProfile = useMemo(() => {
    if (!requireProfile) return false;
    if (!isAuthenticated) return false;
    if (!hasHousehold && !canBypassHousehold) return false;
    if (isSuperAdmin) return false;
    return true;
  }, [
    requireProfile,
    isAuthenticated,
    hasHousehold,
    canBypassHousehold,
    isSuperAdmin,
  ]);

  const [profileGate, setProfileGate] =
    useState<ProfileGateState>(initialProfileGate);

  useEffect(() => {
    let cancelled = false;

    if (!mustCheckProfile || !activeHouseholdId) {
      setProfileGate(initialProfileGate);
      return () => {
        cancelled = true;
      };
    }

    setProfileGate({
      loading: true,
      checked: false,
      hasProfile: false,
      error: null,
    });

    void readMyProfileStatus()
      .then((status) => {
        if (cancelled) return;

        setProfileGate({
          loading: false,
          checked: true,
          hasProfile: Boolean(status.has_profile),
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setProfileGate({
          loading: false,
          checked: true,
          hasProfile: false,
          error: toDomyliError(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mustCheckProfile, activeHouseholdId]);

  if (authLoading || bootstrapLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-alabaster flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/20 border-t-gold animate-spin" />
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-gold">
            Vérification DOMYLI
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to={getAuthenticatedFallbackRoute(hasHousehold)} replace />;
  }

  if (requireHousehold && !hasHousehold && !canBypassHousehold) {
    return <Navigate to={ROUTES.ACTIVATE_HOUSEHOLD} replace />;
  }

  if (mustCheckProfile) {
    if (profileGate.loading || !profileGate.checked) {
      return (
        <GateScreen
          title="Vérification du profil humain"
          description="DOMYLI contrôle que le compte connecté possède bien un profil humain exploitable dans le foyer actif."
        />
      );
    }

    if (profileGate.error) {
      return (
        <GateScreen
          title="Vérification du profil indisponible"
          description={
            profileGate.error.message ||
            "DOMYLI n’a pas pu vérifier le profil humain lié à ce compte."
          }
          primaryLabel="Ouvrir mon profil"
          primaryHref={ROUTES.MY_PROFILE}
          secondaryLabel="Recharger"
          onSecondaryClick={() => window.location.reload()}
        />
      );
    }

    if (!profileGate.hasProfile) {
      return <Navigate to={ROUTES.MY_PROFILE} replace />;
    }
  }

  return <>{children}</>;
}