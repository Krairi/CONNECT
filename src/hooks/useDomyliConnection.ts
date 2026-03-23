import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { toDomyliError, type DomyliAppError } from "../lib/errors";
import {
  userBootstrap,
  type RpcUserBootstrapOutput,
} from "../services/auth/bootstrapService";
import { userActiveHousehold } from "../services/auth/activeHouseholdService";
import { createHousehold } from "../services/households/householdService";

type Membership = {
  household_id: string;
  household_name: string;
  role: string;
};

type ConnectionState = {
  authLoading: boolean;
  bootstrapLoading: boolean;
  sessionEmail: string | null;
  bootstrap: RpcUserBootstrapOutput | null;
  error: DomyliAppError | null;
};

const initialState: ConnectionState = {
  authLoading: true,
  bootstrapLoading: false,
  sessionEmail: null,
  bootstrap: null,
  error: null,
};

function normalizeMembership(input?: Partial<Membership> | null): Membership | null {
  if (!input?.household_id) return null;

  return {
    household_id: input.household_id,
    household_name: input.household_name?.trim() || "Foyer DOMYLI",
    role: input.role?.trim() || "—",
  };
}

export function useDomyliConnection() {
  const [state, setState] = useState<ConnectionState>(initialState);

  const refreshBootstrap = useCallback(async () => {
    setState((prev) => ({ ...prev, bootstrapLoading: true, error: null }));

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("DOMYLI_BOOTSTRAP_TIMEOUT")), 8000);
      });

      const bootstrap = await Promise.race([userBootstrap(), timeoutPromise]);
      const active = await userActiveHousehold();

      console.log("DOMYLI bootstrap raw =>", bootstrap);
      console.log("DOMYLI active household raw =>", active);

      const normalizedMemberships: Membership[] = Array.isArray(bootstrap.memberships)
        ? bootstrap.memberships
            .map((membership) =>
              normalizeMembership({
                household_id: membership.household_id,
                household_name: membership.household_name,
                role: membership.role,
              })
            )
            .filter((membership): membership is Membership => Boolean(membership))
        : [];

      const activeMembershipFromRpc = normalizeMembership({
        household_id: active.active_household_id ?? null,
        household_name: active.household_name ?? null,
        role: active.role ?? null,
      });

      let mergedMemberships = [...normalizedMemberships];

      if (activeMembershipFromRpc) {
        const existingIndex = mergedMemberships.findIndex(
          (membership) => membership.household_id === activeMembershipFromRpc.household_id
        );

        if (existingIndex >= 0) {
          mergedMemberships[existingIndex] = {
            ...mergedMemberships[existingIndex],
            household_name:
              activeMembershipFromRpc.household_name || mergedMemberships[existingIndex].household_name,
            role: activeMembershipFromRpc.role || mergedMemberships[existingIndex].role,
          };
        } else {
          mergedMemberships.unshift(activeMembershipFromRpc);
        }
      }

      const normalized: RpcUserBootstrapOutput = {
        user_id: bootstrap.user_id ?? "",
        active_household_id:
          active.active_household_id ?? bootstrap.active_household_id ?? null,
        is_super_admin: Boolean(bootstrap.is_super_admin),
        memberships: mergedMemberships,
      };

      console.log("DOMYLI merged bootstrap =>", normalized);

      setState((prev) => ({
        ...prev,
        bootstrapLoading: false,
        bootstrap: normalized,
      }));

      return normalized;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        bootstrapLoading: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setState((prev) => ({
          ...prev,
          authLoading: false,
          bootstrapLoading: false,
          error: toDomyliError(error),
        }));
        return;
      }

      const email = data.session?.user?.email ?? null;

      setState((prev) => ({
        ...prev,
        authLoading: false,
        sessionEmail: email,
      }));

      if (data.session) {
        try {
          await refreshBootstrap();
        } catch {
          //
        }
      } else {
        setState((prev) => ({
          ...prev,
          bootstrapLoading: false,
          bootstrap: null,
        }));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setState((prev) => ({
        ...prev,
        authLoading: false,
        sessionEmail: session?.user?.email ?? null,
      }));

      if (session) {
        try {
          await refreshBootstrap();
        } catch {
          //
        }
      } else {
        setState((prev) => ({
          ...prev,
          bootstrapLoading: false,
          bootstrap: null,
        }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshBootstrap]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw toDomyliError(error);
    }
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw toDomyliError(error);
    }
  }, []);

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
        throw toDomyliError({
          code: "DOMYLI_VALIDATION_ERROR",
          message: "Le nom du foyer est obligatoire.",
        });
      }

      const created = await createHousehold({ p_name: trimmedName });

      const createdMembership: Membership = {
        household_id: created.household_id,
        household_name: created.household_name || "Foyer DOMYLI",
        role: created.role || "—",
      };

      setState((prev) => {
        const existingMemberships = Array.isArray(prev.bootstrap?.memberships)
          ? prev.bootstrap.memberships
              .map((membership) =>
                normalizeMembership({
                  household_id: membership.household_id,
                  household_name: membership.household_name,
                  role: membership.role,
                })
              )
              .filter((membership): membership is Membership => Boolean(membership))
          : [];

        const alreadyExists = existingMemberships.some(
          (membership) => membership.household_id === created.household_id
        );

        return {
          ...prev,
          bootstrapLoading: false,
          bootstrap: {
            user_id: prev.bootstrap?.user_id ?? "",
            active_household_id: created.household_id,
            is_super_admin: prev.bootstrap?.is_super_admin ?? false,
            memberships: alreadyExists
              ? existingMemberships
              : [createdMembership, ...existingMemberships],
          },
        };
      });

      refreshBootstrap().catch(() => {
        //
      });

      return created;
    },
    [refreshBootstrap]
  );

  const derived = useMemo(() => {
    const memberships = Array.isArray(state.bootstrap?.memberships)
      ? state.bootstrap.memberships
      : [];

    const activeMembership =
      memberships.find(
        (membership) => membership.household_id === state.bootstrap?.active_household_id
      ) ??
      memberships[0] ??
      (state.bootstrap?.active_household_id
        ? {
            household_id: state.bootstrap.active_household_id,
            household_name: "Foyer DOMYLI",
            role: "—",
          }
        : null);

    return {
      isAuthenticated: Boolean(state.sessionEmail),
      hasHousehold: Boolean(state.bootstrap?.active_household_id),
      activeMembership,
    };
  }, [state.bootstrap, state.sessionEmail]);

  return {
    ...state,
    ...derived,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    refreshBootstrap,
    createFirstHousehold,
  };
}