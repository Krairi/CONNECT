export type MealCandidateUi = {
  recipeId: string
  recipeCode: string
  recipeTitle: string
  mealType: string
  profileId: string | null
  profileDisplayName: string
  compatibilityScore: number
  compatibilitySummary: string
  missingCount: number
  isFeasible: boolean
  updatedAt: string | null
}

export type MealSlotUi = {
  slotId: string
  slotDate: string
  mealType: string
  status: string
  profileId: string | null
  profileDisplayName: string
  recipeId: string | null
  recipeTitle: string
  missingCount: number
  isFeasible: boolean
  updatedAt: string | null
}

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 1) return true
  if (value === 'false' || value === '0' || value === 0) return false
  return fallback
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

export function adaptMealCandidate(row: Record<string, unknown>): MealCandidateUi {
  return {
    recipeId: asString(row.recipe_id ?? row.recipeId ?? row.id),
    recipeCode: asString(row.recipe_code ?? row.recipeCode ?? row.code, ''),
    recipeTitle: asString(row.recipe_title ?? row.recipeTitle ?? row.title, 'Recette'),
    mealType: asString(row.meal_type ?? row.mealType, 'UNKNOWN'),
    profileId: asNullableString(row.profile_id ?? row.profileId),
    profileDisplayName: asString(
      row.profile_display_name ?? row.profileDisplayName ?? row.display_name,
      'Profil',
    ),
    compatibilityScore: asNumber(row.compatibility_score ?? row.compatibilityScore, 0),
    compatibilitySummary: asString(
      row.compatibility_summary ?? row.compatibilitySummary ?? row.summary,
      '',
    ),
    missingCount: asNumber(row.missing_count ?? row.missingCount, 0),
    isFeasible: asBoolean(row.is_feasible ?? row.isFeasible, false),
    updatedAt: asNullableString(row.updated_at ?? row.updatedAt),
  }
}

export function adaptMealSlot(row: Record<string, unknown>): MealSlotUi {
  return {
    slotId: asString(row.slot_id ?? row.slotId ?? row.id),
    slotDate: asString(row.slot_date ?? row.slotDate ?? row.day, ''),
    mealType: asString(row.meal_type ?? row.mealType, 'UNKNOWN'),
    status: asString(row.status, 'PENDING'),
    profileId: asNullableString(row.profile_id ?? row.profileId),
    profileDisplayName: asString(
      row.profile_display_name ?? row.profileDisplayName ?? row.display_name,
      'Profil',
    ),
    recipeId: asNullableString(row.recipe_id ?? row.recipeId),
    recipeTitle: asString(row.recipe_title ?? row.recipeTitle ?? row.title, ''),
    missingCount: asNumber(row.missing_count ?? row.missingCount, 0),
    isFeasible: asBoolean(row.is_feasible ?? row.isFeasible, false),
    updatedAt: asNullableString(row.updated_at ?? row.updatedAt),
  }
}

export function adaptMealCandidates(rows: unknown): MealCandidateUi[] {
  return asArray<Record<string, unknown>>(rows).map(adaptMealCandidate)
}

export function adaptMealSlots(rows: unknown): MealSlotUi[] {
  return asArray<Record<string, unknown>>(rows).map(adaptMealSlot)
}

export type MealsBuild3ASnapshot = {
  slots: MealSlotUi[]
  candidates: MealCandidateUi[]
  hasSlots: boolean
  hasCandidates: boolean
  feasibleSlotsCount: number
  blockedSlotsCount: number
  totalMissingCount: number
}

export function buildMealsBuild3ASnapshot(
  slots: MealSlotUi[],
  candidates: MealCandidateUi[],
): MealsBuild3ASnapshot {
  const feasibleSlotsCount = slots.filter((slot) => slot.isFeasible).length
  const blockedSlotsCount = slots.filter((slot) => !slot.isFeasible).length
  const totalMissingCount =
    slots.reduce((sum, slot) => sum + slot.missingCount, 0) +
    candidates.reduce((sum, candidate) => sum + candidate.missingCount, 0)

  return {
    slots,
    candidates,
    hasSlots: slots.length > 0,
    hasCandidates: candidates.length > 0,
    feasibleSlotsCount,
    blockedSlotsCount,
    totalMissingCount,
  }
}