import { useMemo } from 'react'
import { useMealsBuild3A } from '@/hooks/useMealsBuild3A'
import {
  buildDashboardMealsCardModel,
  type DashboardMealsViewMode,
  type DashboardMealsCardModel,
} from '@/view-models/dashboardMealsBuild3A'

export type UseDashboardMealsBuild3AParams = {
  enabled: boolean
  from: string
  to: string
  profileId?: string | null
  profileDisplayName?: string | null
  mealType?: string | null
  limit?: number
}

export type UseDashboardMealsBuild3AResult = {
  loading: boolean
  error: string | null
  card: DashboardMealsCardModel
  refresh: () => Promise<void>
}

export function useDashboardMealsBuild3A(
  params: UseDashboardMealsBuild3AParams,
): UseDashboardMealsBuild3AResult {
  const meals = useMealsBuild3A({
    enabled: params.enabled,
    from: params.from,
    to: params.to,
    profileId: params.profileId ?? null,
    mealType: params.mealType ?? null,
    limit: params.limit ?? 24,
  })

  const mode: DashboardMealsViewMode = params.profileId ? 'PROFILE' : 'HOUSEHOLD'

  const card = useMemo(
    () =>
      buildDashboardMealsCardModel({
        mode,
        profileDisplayName: params.profileDisplayName ?? null,
        snapshot: meals.snapshot,
      }),
    [mode, params.profileDisplayName, meals.snapshot],
  )

  return {
    loading: meals.loading,
    error: meals.error,
    card,
    refresh: meals.refresh,
  }
}