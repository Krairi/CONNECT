import { supabase } from '@/lib/supabase'
import {
  adaptMealCandidates,
  adaptMealSlots,
  buildMealsBuild3ASnapshot,
  type MealCandidateUi,
  type MealSlotUi,
  type MealsBuild3ASnapshot,
} from '@/adapters/mealsCompatAdapter'

export type FetchMealRecipeCandidatesParams = {
  profileId?: string | null
  mealType?: string | null
  limit?: number
}

export type FetchMealSlotsFeedParams = {
  from: string
  to: string
  profileId?: string | null
}

export type FetchMealsBuild3AParams = {
  from: string
  to: string
  profileId?: string | null
  mealType?: string | null
  limit?: number
}

function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
  }
  return fallback
}

export async function fetchMealRecipeCandidates(
  params: FetchMealRecipeCandidatesParams,
): Promise<MealCandidateUi[]> {
  const { data, error } = await supabase
    .schema('app')
    .rpc('rpc_meal_recipe_candidates_v3', {
      p_profile_id: params.profileId ?? null,
      p_meal_type: params.mealType ?? null,
      p_limit: params.limit ?? 24,
    })

  if (error) {
    throw new Error(
      normalizeErrorMessage(error, 'Impossible de charger les recettes candidates Meals.'),
    )
  }

  return adaptMealCandidates(data)
}

export async function fetchMealSlotsFeed(
  params: FetchMealSlotsFeedParams,
): Promise<MealSlotUi[]> {
  const { data, error } = await supabase
    .schema('app')
    .rpc('rpc_meal_slots_feed_v1', {
      p_from: params.from,
      p_to: params.to,
      p_profile_id: params.profileId ?? null,
    })

  if (error) {
    throw new Error(
      normalizeErrorMessage(error, 'Impossible de charger le flux des slots Meals.'),
    )
  }

  return adaptMealSlots(data)
}

export async function fetchMealsBuild3ASnapshot(
  params: FetchMealsBuild3AParams,
): Promise<MealsBuild3ASnapshot> {
  const [slots, candidates] = await Promise.all([
    fetchMealSlotsFeed({
      from: params.from,
      to: params.to,
      profileId: params.profileId ?? null,
    }),
    fetchMealRecipeCandidates({
      profileId: params.profileId ?? null,
      mealType: params.mealType ?? null,
      limit: params.limit ?? 24,
    }),
  ])

  return buildMealsBuild3ASnapshot(slots, candidates)
}