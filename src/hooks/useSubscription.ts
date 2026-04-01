import { useCallback, useEffect, useMemo, useState } from "react";

import {
  readPricingPlans,
  readSubscriptionChangePreview,
  readSubscriptionSnapshot,
  type PlanCode,
  type PricingPlan,
  type SubscriptionChangePreview,
  type SubscriptionSnapshot,
} from "@/src/services/subscription/subscriptionService";
import type { DomyliError } from "@/src/lib/errors";

type SubscriptionState = {
  loading: boolean;
  previewLoading: boolean;
  error: DomyliError | null;
  pricingPlans: PricingPlan[];
  snapshot: SubscriptionSnapshot | null;
  selectedTargetPlanCode: PlanCode | null;
  preview: SubscriptionChangePreview | null;
};

const initialState: SubscriptionState = {
  loading: true,
  previewLoading: false,
  error: null,
  pricingPlans: [],
  snapshot: null,
  selectedTargetPlanCode: null,
  preview: null,
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [pricingPlans, snapshot] = await Promise.all([readPricingPlans(), readSubscriptionSnapshot()]);
      const suggested = snapshot.upgrade_suggestion.target_plan_code ?? null;
      setState((prev) => ({
        ...prev,
        loading: false,
        pricingPlans,
        snapshot,
        selectedTargetPlanCode: prev.selectedTargetPlanCode ?? suggested,
        preview: null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error as DomyliError }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectTargetPlan = useCallback(async (targetPlanCode: PlanCode | null) => {
    setState((prev) => ({ ...prev, selectedTargetPlanCode: targetPlanCode }));
    if (!targetPlanCode) {
      setState((prev) => ({ ...prev, preview: null, previewLoading: false }));
      return;
    }
    setState((prev) => ({ ...prev, previewLoading: true, error: null }));
    try {
      const preview = await readSubscriptionChangePreview(targetPlanCode);
      setState((prev) => ({ ...prev, previewLoading: false, preview }));
    } catch (error) {
      setState((prev) => ({ ...prev, previewLoading: false, error: error as DomyliError }));
    }
  }, []);

  useEffect(() => {
    if (!state.snapshot || !state.selectedTargetPlanCode) return;
    if (state.preview?.target_plan_code === state.selectedTargetPlanCode) return;
    void selectTargetPlan(state.selectedTargetPlanCode);
  }, [state.snapshot, state.selectedTargetPlanCode, state.preview, selectTargetPlan]);

  const currentPlan = useMemo(() => {
    if (!state.snapshot) return null;
    return state.pricingPlans.find((plan) => plan.plan_code === state.snapshot?.current_plan_code) ?? state.snapshot.plan;
  }, [state.pricingPlans, state.snapshot]);

  return {
    ...state,
    currentPlan,
    refresh,
    selectTargetPlan,
  };
}
