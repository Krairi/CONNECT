import { useCallback, useEffect, useState } from "react";

import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  acceptHouseholdInvite,
  inviteHouseholdMember,
  listHouseholdMembers,
  type HouseholdInviteAcceptResult,
  type HouseholdInviteCreateResult,
  type HouseholdMemberItem,
} from "@/src/services/households/householdMembersService";

type HouseholdMembersState = {
  loading: boolean;
  inviting: boolean;
  accepting: boolean;
  error: DomyliAppError | null;
  members: HouseholdMemberItem[];
  lastInvite: HouseholdInviteCreateResult | null;
  lastAccepted: HouseholdInviteAcceptResult | null;
};

const initialState: HouseholdMembersState = {
  loading: false,
  inviting: false,
  accepting: false,
  error: null,
  members: [],
  lastInvite: null,
  lastAccepted: null,
};

export function useHouseholdMembers() {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const members = await listHouseholdMembers();
      setState((prev) => ({
        ...prev,
        loading: false,
        members,
      }));
      return members;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const inviteMember = useCallback(async (email: string, role: string) => {
    setState((prev) => ({
      ...prev,
      inviting: true,
      error: null,
      lastInvite: null,
    }));

    try {
      const invite = await inviteHouseholdMember(email, role);
      const members = await listHouseholdMembers();

      setState((prev) => ({
        ...prev,
        inviting: false,
        members,
        lastInvite: invite,
      }));

      return invite;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        inviting: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  const acceptInvite = useCallback(async (token: string) => {
    setState((prev) => ({
      ...prev,
      accepting: true,
      error: null,
      lastAccepted: null,
    }));

    try {
      const accepted = await acceptHouseholdInvite(token);
      setState((prev) => ({
        ...prev,
        accepting: false,
        lastAccepted: accepted,
      }));
      return accepted;
    } catch (error) {
      const normalized = toDomyliError(error);
      setState((prev) => ({
        ...prev,
        accepting: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  return {
    ...state,
    refresh,
    inviteMember,
    acceptInvite,
  };
}
