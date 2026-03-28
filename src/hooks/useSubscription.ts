import { useCallback, useEffect, useState } from "react";
import { toDomyliError, type DomyliAppError } from "@/src/lib/errors";
import {
  assertQuota,
  readSubscriptionState,
  type QuotaAssertResult,
  type SubscriptionState,
} from "@/src/services/subscription/subscriptionService";

type SubscriptionStateView = {
  loading: boolean;
  checking: boolean;
  error: DomyliAppError | null;
  subscription: SubscriptionState | null;
  lastQuotaCheck: QuotaAssertResult | null;
};

const initialState: SubscriptionStateView = {
  loading: false,
  checking: false,
  error: null,
  subscription: null,
  lastQuotaCheck: null,
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionStateView>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const subscription = await readSubscriptionState();

      setState((prev) => ({
        ...prev,
        loading: false,
        subscription,
      }));

      return subscription;
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

  const checkQuota = useCallback(async (limitName: string, requestedValue: number) => {
    setState((prev) => ({
      ...prev,
      checking: true,
      error: null,
      lastQuotaCheck: null,
    }));

    try {
      const result = await assertQuota(limitName, requestedValue);

      setState((prev) => ({
        ...prev,
        checking: false,
        lastQuotaCheck: result,
      }));

      return result;
    } catch (error) {
      const normalized = toDomyliError(error);

      setState((prev) => ({
        ...prev,
        checking: false,
        error: normalized,
      }));

      throw normalized;
    }
  }, []);

  return {
    ...state,
    refresh,
    checkQuota,
  };
}