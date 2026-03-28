import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { callRpc } from "@/src/services/rpc";
import {
  createDomyliError,
  toDomyliError,
  type DomyliAppError,
} from "@/src/lib/errors";

export type Membership = {
  household_id: string;
  household_name: string;
  role: string;
};

type BootstrapState = {
  user_id: string;
  active_household_id: string | null;
  is_super_admin: boolean;
  memberships: Membership[];
};

type AuthState = {
  authLoading: boolean;
  bootstrapLoading: boolean;
  sessionEmail: string | null;
  bootstrap: BootstrapState | null;
  error: DomyliAppError | null;
};

type RawBootstrap = {
  user_id?: string | null;
  active_household_id?: string | null;
  is_super_admin?: boolean | null;
  memberships?:
    | Array<{
        household_id?: string | null;
        household_name?: string | null;
        role?: string | null;
      }>
    | null;
};

type RawActiveHousehold = {
  active_household_id?: string | null;
  household_id?: string | null;
  household_name?: string | null;
  name?: string | null;
  role?: string | null;
};

type RawHouseholdCreate = {
  household_id?: string | null;
  household_name?: string | null;
  role?: string | null;
};

const initialState: AuthState = {
  authLoading: true,
  bootstrapLoading: false,
  sessionEmail: null,
  bootstrap: null,
  error: null,
};

function normalizeMembership(
  input?:
    | {
        household_id?: string | null;
        household_name?: string | null;
        role?: string | null;
      }
    | null,
): Membership | null {
  if (!input?.household_id) {
    return null;
  }

  return {
    household_id: input.household_id,
    household_name: input.household_name?.trim() || "Foyer DOMYLI",
    role: input.role?.trim() || "MEMBRE",
  };
}

function mergeMemberships(
  current: Membership[],
  incoming: Membership | null,
): Membership[] {
  if (!incoming) {
    return current;
  }

  const exists = current.some(
    (membership) => membership.household_id === incoming.household_id,
  );

  if (!exists) {
    return [incoming, ...current];
  }

  return current.map((membership) =>
    membership.household_id === incoming.household_id
      ? incoming
      : membership,
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useDomyliAuthState() {
  const [state, setState] = useState<AuthState>(initialState);

  const refreshBootstrap = useCallback(
    async (options?: {
      retries?: number;
      retryDelayMs?: number;
      bootstrapTimeoutMs?: number;
      activeTimeoutMs?: number;
    }) => {
      const retries = options?.retries ?? 0;
      const retryDelayMs = options?.retryDelayMs ?? 900;
      const bootstrapTimeoutMs = options?.bootstrapTimeoutMs ?? 10_000;
      const activeTimeoutMs = options?.activeTimeoutMs ?? 10_000;

      setState((prev) => ({
        ...prev,
        bootstrapLoading: true,
        error: null,
      }));

      let lastError: unknown = null;

      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          const [rawBootstrap, rawActive] = await Promise.all([
            callRpc<RawBootstrap>("rpc_user_bootstrap", {}, {
              unwrap: true,
              timeoutMs: bootstrapTimeoutMs,
            }),
            callRpc<RawActiveHousehold>("rpc_user_active_household", {}, {
              unwrap: true,
              timeoutMs: activeTimeoutMs,
            }),
          ]);

          const memberships = Array.isArray(rawBootstrap?.memberships)
            ? rawBootstrap.memberships
                .map((membership) =>
                  normalizeMembership({
                    household_id: membership.household_id ?? null,
                    household_name: membership.household_name ?? null,
                    role: membership.role ?? null,
                  }),
                )
                .filter((membership): membership is Membership =>
                  Boolean(membership),
                )
            : [];

          const activeMembership = normalizeMembership({
            household_id:
              rawActive?.active_household_id ?? rawActive?.household_id ?? null,
            household_name:
              rawActive?.household_name ?? rawActive?.name ?? null,
            role: rawActive?.role ?? null,
          });

          const mergedMemberships = activeMembership
            ? mergeMemberships(memberships, activeMembership)
            : memberships;

          const normalized: BootstrapState = {
            user_id: rawBootstrap?.user_id ?? "",
            active_household_id:
              rawActive?.active_household_id ??
              rawActive?.household_id ??
              rawBootstrap?.active_household_id ??
              null,
            is_super_admin: Boolean(rawBootstrap?.is_super_admin),
            memberships: mergedMemberships,
          };

          setState((prev) => ({
            ...prev,
            bootstrapLoading: false,
            bootstrap: normalized,
            error: null,
          }));

          return normalized;
        } catch (error) {
          lastError = toDomyliError(error);

          if (attempt >= retries) {
            setState((prev) => ({
              ...prev,
              bootstrapLoading: false,
              error: toDomyliError(lastError),
            }));

            throw toDomyliError(lastError);
          }

          await delay(retryDelayMs);
        }
      }

      throw toDomyliError(lastError);
    },
    [],
  );

  const syncFromSession = useCallback(
    async (session: Session | null) => {
      setState((prev) => ({
        ...prev,
        authLoading: false,
        sessionEmail: session?.user?.email ?? null,
      }));

      if (!session) {
        setState((prev) => ({
          ...prev,
          authLoading: false,
          bootstrapLoading: false,
          bootstrap: null,
          error: null,
        }));
        return;
      }

      await refreshBootstrap();
    },
    [refreshBootstrap],
  );

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setState((prev) => ({
          ...prev,
          authLoading: false,
          bootstrapLoading: false,
          error: toDomyliError(error),
        }));
        return;
      }

      await syncFromSession(data.session);
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      void syncFromSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw toDomyliError(error);
      }
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw toDomyliError(error);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw toDomyliError(error);
    }
  }, []);

  const createFirstHousehold = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw createDomyliError({
          message: "Le nom du foyer est obligatoire.",
          code: "DOMYLI_VALIDATION_ERROR",
        });
      }

      const created = await callRpc<RawHouseholdCreate>(
        "rpc_household_create",
        { p_name: trimmedName },
        {
          unwrap: true,
          timeoutMs: 25_000,
          retries: 1,
          retryDelayMs: 1_200,
        },
      );

      const createdMembership = normalizeMembership({
        household_id: created?.household_id ?? null,
        household_name: created?.household_name ?? trimmedName,
        role: created?.role ?? "GARANTE",
      });

      if (createdMembership) {
        setState((prev) => ({
          ...prev,
          bootstrapLoading: true,
          error: null,
          bootstrap: {
            user_id: prev.bootstrap?.user_id ?? "",
            active_household_id:
              createdMembership.household_id ??
              prev.bootstrap?.active_household_id ??
              null,
            is_super_admin: prev.bootstrap?.is_super_admin ?? false,
            memberships: mergeMemberships(
              prev.bootstrap?.memberships ?? [],
              createdMembership,
            ),
          },
        }));
      }

      try {
        await refreshBootstrap({
          retries: 3,
          retryDelayMs: 1_000,
          bootstrapTimeoutMs: 15_000,
          activeTimeoutMs: 15_000,
        });
      } catch (error) {
        if (!createdMembership) {
          throw error;
        }

        setState((prev) => ({
          ...prev,
          bootstrapLoading: false,
          error: null,
          bootstrap: {
            user_id: prev.bootstrap?.user_id ?? "",
            active_household_id: createdMembership.household_id,
            is_super_admin: prev.bootstrap?.is_super_admin ?? false,
            memberships: mergeMemberships(
              prev.bootstrap?.memberships ?? [],
              createdMembership,
            ),
          },
        }));
      }

      return {
        household_id: createdMembership?.household_id ?? "",
        household_name: createdMembership?.household_name ?? trimmedName,
        role: createdMembership?.role ?? "GARANTE",
      };
    },
    [refreshBootstrap],
  );

  const derived = useMemo(() => {
    const memberships = state.bootstrap?.memberships ?? [];

    const activeMembership =
      memberships.find(
        (membership) =>
          membership.household_id === state.bootstrap?.active_household_id,
      ) ??
      memberships[0] ??
      null;

    return {
      isAuthenticated: Boolean(state.sessionEmail),
      hasHousehold: Boolean(
        state.bootstrap?.active_household_id ?? activeMembership?.household_id,
      ),
      activeMembership,
    };
  }, [state.bootstrap, state.sessionEmail]);

  return {
    ...state,
    ...derived,
    refreshBootstrap,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    createFirstHousehold,
  };
}