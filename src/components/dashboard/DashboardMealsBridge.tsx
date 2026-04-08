import type { DashboardMealsCardModel } from '@/view-models/dashboardMealsBuild3A'

export type DashboardMealsBridgeProps = {
  loading: boolean
  error: string | null
  card: DashboardMealsCardModel
}

export default function DashboardMealsBridge({
  loading,
  error,
  card,
}: DashboardMealsBridgeProps) {
  if (loading) {
    return (
      <section data-testid="dashboard-meals-build3a">
        <div>Chargement meals…</div>
      </section>
    )
  }

  if (error) {
    return (
      <section data-testid="dashboard-meals-build3a">
        <div>{error}</div>
      </section>
    )
  }

  if (card.isEmpty) {
    return (
      <section data-testid="dashboard-meals-build3a">
        <header>
          <h3>{card.title}</h3>
          <p>{card.subtitle}</p>
        </header>

        <div>
          <strong>{card.emptyTitle}</strong>
          <p>{card.emptyDescription}</p>
        </div>
      </section>
    )
  }

  return (
    <section data-testid="dashboard-meals-build3a">
      <header>
        <h3>{card.title}</h3>
        <p>{card.subtitle}</p>
      </header>

      <div>
        <div>Slots : {card.slotCount}</div>
        <div>Candidates : {card.candidateCount}</div>
        <div>Faisables : {card.feasibleCount}</div>
        <div>Bloqués : {card.blockedCount}</div>
        <div>Manque total : {card.missingCount}</div>
      </div>

      {card.topSlots.length > 0 ? (
        <div>
          <h4>Slots</h4>
          <ul>
            {card.topSlots.map((slot) => (
              <li key={slot.slotId}>
                <strong>{slot.mealType}</strong> · {slot.slotDate} · {slot.profileDisplayName}
                {slot.recipeTitle ? ` · ${slot.recipeTitle}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {card.topCandidates.length > 0 ? (
        <div>
          <h4>Recettes candidates</h4>
          <ul>
            {card.topCandidates.map((candidate) => (
              <li key={`${candidate.profileId ?? 'household'}-${candidate.recipeId}`}>
                <strong>{candidate.mealType}</strong> · {candidate.recipeTitle} ·{' '}
                {candidate.profileDisplayName}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}