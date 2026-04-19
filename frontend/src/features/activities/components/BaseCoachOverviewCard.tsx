import type {
  BaseCoachResult,
  CoachingFeedbackSeverity,
  ComponentRatingValue,
} from '../api/activities'

type BaseCoachOverviewCardProps = {
  baseCoachResult: BaseCoachResult
}

function formatComponentName(componentName: string): string {
  switch (componentName) {
    case 'intensity_distribution':
      return 'Intensity distribution'
    case 'weekly_running_volume_progression':
      return 'Weekly running volume'
    case 'longest_run_progression':
      return 'Longest run progression'
    default:
      return componentName
  }
}

function getRatingClassName(rating: ComponentRatingValue): string {
  switch (rating) {
    case 'Good':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Caution':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'Needs attention':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-stone-200 bg-white text-zinc-700'
  }
}

function getFeedbackClassName(
  severity: CoachingFeedbackSeverity | null,
): string {
  switch (severity) {
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'info':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    default:
      return 'border-stone-200 bg-white text-zinc-700'
  }
}

function getScoreLabel(score: number): string {
  if (score >= 80) {
    return 'Strong base'
  }

  if (score >= 60) {
    return 'Needs care'
  }

  return 'Needs attention'
}

function getScoreDescription(score: number): string {
  if (score >= 80) {
    return 'Your recent running pattern supports steady aerobic development.'
  }

  if (score >= 60) {
    return 'Your base is usable, but one or more training signals need attention.'
  }

  return 'Your recent training pattern suggests a higher risk base-building block.'
}

function formatAnalysisPeriod(startDate: string, endDate: string): string {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  const includeStartYear = start.getUTCFullYear() !== end.getUTCFullYear()

  return [
    formatShortDate(start, includeStartYear),
    formatShortDate(end, true),
  ].join(' - ')
}

function parseIsoDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function formatShortDate(date: Date, includeYear: boolean): string {
  const months = [
    'jan',
    'feb',
    'mrt',
    'apr',
    'mei',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
  ]
  const formattedDate = `${date.getUTCDate()} ${months[date.getUTCMonth()]}`

  return includeYear
    ? `${formattedDate} ${date.getUTCFullYear()}`
    : formattedDate
}

export function BaseCoachOverviewCard({
  baseCoachResult,
}: BaseCoachOverviewCardProps) {
  const score = Math.round(baseCoachResult.baseTrainingScore.totalScore)
  const scoreLabel = getScoreLabel(score)
  const scoreDescription = getScoreDescription(score)

  const componentRatings = baseCoachResult.componentRatings
  const feedbackMessages = baseCoachResult.feedbackMessages.slice(0, 3)

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Base training score
          </p>
          {baseCoachResult.analysisPeriod ? (
            <p className="mt-2 text-sm font-medium text-zinc-600">
              Meest recente trainingsweek:{' '}
              {formatAnalysisPeriod(
                baseCoachResult.analysisPeriod.startDate,
                baseCoachResult.analysisPeriod.endDate,
              )}
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
            {scoreLabel}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            {scoreDescription}
          </p>
        </div>

        <div className="flex items-end gap-2 md:text-right">
          <span className="text-6xl font-bold tracking-tight text-zinc-950">
            {score}
          </span>
          <span className="pb-2 text-lg font-semibold text-zinc-500">
            /100
          </span>
        </div>
      </div>
      {componentRatings.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {componentRatings.map((componentRating) => (
            <div
              key={componentRating.componentName}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <p className="text-sm font-medium text-zinc-900">
                {formatComponentName(componentRating.componentName)}
              </p>
              <span
                className={[
                  'mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                  getRatingClassName(componentRating.rating),
                ].join(' ')}
              >
                {componentRating.rating}
              </span>
              {componentRating.reason ? (
                <p className="mt-3 text-sm leading-5 text-zinc-600">
                  {componentRating.reason}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {feedbackMessages.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Coach feedback
          </p>
          {feedbackMessages.map((feedbackMessage) => (
            <div
              key={`${feedbackMessage.componentName}-${feedbackMessage.message}`}
              className={[
                'rounded-xl border p-4 text-sm leading-6',
                getFeedbackClassName(feedbackMessage.severity),
              ].join(' ')}
            >
              {feedbackMessage.message}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
