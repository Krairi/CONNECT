import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchMealRecipeCandidates,
  fetchMealSlotsFeed,
  fetchMealsBuild3ASnapshot,
  type FetchMealsBuild3AParams,
} from '@/services/mealsCompatService'
import type {
  MealCandidateUi,
  MealSlotUi,
  MealsBuild3ASnapshot,
} from '@/adapters/mealsCompatAdapter'

export type UseMealsBuild3AParams = FetchMealsBuild3AParams & {
  enabled?: boolean
}

export type UseMealsBuild3AResult = {
  loading: boolean
  error: string | null
  slots: MealSlotUi[]
  candidates: MealCandidateUi[]
  snapshot: MealsBuild3ASnapshot | null
  refresh: () => Promise<void>
}

const EMPTY_SNAPSHOT: MealsBuild3ASnapshot = {
  slots: [],
  candidates: [],
  hasSlots: false,
  hasCandidates: false,
  feasibleSlotsCount: 0,
  blockedSlotsCount: 0,
  totalMissingCount: 0,
}

function normalizeHookError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Une erreur est survenue pendant le chargement Meals Build 3A.'
}

export function useMealsBuild3A(params: UseMealsBuild3AParams): UseMealsBuild3AResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<MealSlotUi[]>([])
  const [candidates, setCandidates] = useState<MealCandidateUi[]>([])
  const [snapshot, setSnapshot] = useState<MealsBuild3ASnapshot | null>(null)

  const enabled = params.enabled ?? true

  const stableParams = useMemo(
    () => ({
      from: params.from,
      to: params.to,
      profileId: params.profileId ?? null,
      mealType: params.mealType ?? null,
      limit: params.limit ?? 24,
    }),
    [params.from, params.to, params.profileId, params.mealType, params.limit],
  )

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      setError(null)
      setSlots([])
      setCandidates([])
      setSnapshot(EMPTY_SNAPSHOT)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [nextSlots, nextCandidates, nextSnapshot] = await Promise.all([
        fetchMealSlotsFeed({
          from: stableParams.from,
          to: stableParams.to,
          profileId: stableParams.profileId,
        }),
        fetchMealRecipeCandidates({
          profileId: stableParams.profileId,
          mealType: stableParams.mealType,
          limit: stableParams.limit,
        }),
        fetchMealsBuild3ASnapshot(stableParams),
      ])

      setSlots(nextSlots)
      setCandidates(nextCandidates)
      setSnapshot(nextSnapshot)
    } catch (err) {
      setError(normalizeHookError(err))
      setSlots([])
      setCandidates([])
      setSnapshot(EMPTY_SNAPSHOT)
    } finally {
      setLoading(false)
    }
  }, [enabled, stableParams])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    loading,
    error,
    slots,
    candidates,
    snapshot,
    refresh,
  }
}