import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  acceptHouseholdInvite,
  inviteHouseholdMember,
  listHouseholdMembers,
  type HouseholdMemberItem,
} from "@/src/services/households/householdMembersService";

type HouseholdMembersState = {
  loading: boolean;
  inviting: boolean;
  accepting: boolean;
  error: DomyliAppError | null;
  members: HouseholdMemberItem[];
  lastInviteId: string | null;
  lastAcceptedHouseholdId: string | null;
};

const initialState: HouseholdMembersState = {
  loading: false,
  inviting: false,
  accepting: false,
  error: null,
  members: [],
  lastInviteId: null,
  lastAcceptedHouseholdId: null,
};

export function useHouseholdMembers() {
  const [state, setState] = useState<HouseholdMembersState>(initialState);

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
      lastInviteId: null,
    }));

    try {
      const inviteId = await inviteHouseholdMember(email, role);
      const members = await listHouseholdMembers();

      setState((prev) => ({
        ...prev,
        inviting: false,
        members,
        lastInviteId: inviteId,
      }));

      return inviteId;
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
      lastAcceptedHouseholdId: null,
    }));

    try {
      const householdId = await acceptHouseholdInvite(token);

      setState((prev) => ({
        ...prev,
        accepting: false,
        lastAcceptedHouseholdId: householdId,
      }));

      return householdId;
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