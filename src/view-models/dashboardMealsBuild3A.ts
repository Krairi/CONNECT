import type {
  MealCandidateUi,
  MealSlotUi,
  MealsBuild3ASnapshot,
} from '@/adapters/mealsCompatAdapter'

export type DashboardMealsViewMode = 'PROFILE' | 'HOUSEHOLD'

export type DashboardMealsCardModel = {
  mode: DashboardMealsViewMode
  title: string
  subtitle: string
  slotCount: number
  candidateCount: number
  feasibleCount: number
  blockedCount: number
  missingCount: number
  hasData: boolean
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  topSlots: MealSlotUi[]
  topCandidates: MealCandidateUi[]
}

export type BuildDashboardMealsCardModelInput = {
  mode: DashboardMealsViewMode
  profileDisplayName?: string | null
  snapshot: MealsBuild3ASnapshot | null
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular
}

function buildTitle(mode: DashboardMealsViewMode, profileDisplayName?: string | null): string {
  if (mode === 'PROFILE' && profileDisplayName) {
    return `Meals · ${profileDisplayName}`
  }

  if (mode === 'PROFILE') {
    return 'Meals · Profil'
  }

  return 'Meals · Foyer'
}

function buildSubtitle(
  mode: DashboardMealsViewMode,
  slotCount: number,
  candidateCount: number,
): string {
  if (mode === 'PROFILE') {
    return `${slotCount} ${pluralize(slotCount, 'slot', 'slots')} · ${candidateCount} ${pluralize(candidateCount, 'candidate', 'candidates')}`
  }

  return `${slotCount} ${pluralize(slotCount, 'slot', 'slots')} consolidés · ${candidateCount} ${pluralize(candidateCount, 'candidate', 'candidates')}`
}

export function buildDashboardMealsCardModel(
  input: BuildDashboardMealsCardModelInput,
): DashboardMealsCardModel {
  const snapshot = input.snapshot
  const slots = snapshot?.slots ?? []
  const candidates = snapshot?.candidates ?? []
  const slotCount = slots.length
  const candidateCount = candidates.length
  const feasibleCount = snapshot?.feasibleSlotsCount ?? 0
  const blockedCount = snapshot?.blockedSlotsCount ?? 0
  const missingCount = snapshot?.totalMissingCount ?? 0

  const hasData = slotCount > 0 || candidateCount > 0
  const isEmpty = !hasData

  const emptyTitle =
    input.mode === 'PROFILE'
      ? 'Aucun meal planifié pour ce profil'
      : 'Aucun meal planifié pour le foyer'

  const emptyDescription =
    input.mode === 'PROFILE'
      ? 'Le profil est prêt, mais aucun slot meal n’est encore présent sur la période sélectionnée.'
      : 'Le foyer est prêt, mais aucun slot meal consolidé n’est encore présent sur la période sélectionnée.'

  return {
    mode: input.mode,
    title: buildTitle(input.mode, input.profileDisplayName),
    subtitle: buildSubtitle(input.mode, slotCount, candidateCount),
    slotCount,
    candidateCount,
    feasibleCount,
    blockedCount,
    missingCount,
    hasData,
    isEmpty,
    emptyTitle,
    emptyDescription,
    topSlots: slots.slice(0, 6),
    topCandidates: candidates.slice(0, 6),
  }
}