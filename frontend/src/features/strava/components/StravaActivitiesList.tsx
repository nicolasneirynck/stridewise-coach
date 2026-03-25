import { type StravaActivity } from "../api/strava";

interface StravaActivitiesListProps{
  activities: StravaActivity[]
}

function metersToKms(meters:number):string{
  return `${(meters/1000).toFixed(2)} km`
}

function formatActivityDate(date:string):string{
  return new Intl.DateTimeFormat('en-GB',{
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))
}

function formatActivityMeta(activity: StravaActivity): string{
  return activity.sportType + ' • ' + formatActivityDate(activity.startDate) + ' • ' + metersToKms(activity.distanceMeters)
}

export function StravaActivitiesList({activities}: StravaActivitiesListProps){

  const hasActivities = activities.length > 0
  const sortedActivities = activities.toSorted((a, b) =>  Date.parse(b.startDate) - Date.parse(a.startDate))
  const recentActivitiesLimit = 5
  const visibleActivities = sortedActivities.slice(0,recentActivitiesLimit)
  const isTruncated = activities.length > recentActivitiesLimit
  const visibleCount = visibleActivities.length
  const summaryText = isTruncated 
          ? `Showing ${visibleCount} recent activities out of ${activities.length}`
          : `Showing all ${activities.length} activities`

          // the section is named "Recent activities" for the screen-readers
  return <section aria-labelledby="strava-activities-heading" className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
    <header className="mb-6">
      <h2 id="strava-activities-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Recent activities</h2>
      <p className="mt-2 text-sm text-zinc-600">
        {summaryText}
      </p>
    </header>
    {hasActivities ?
    <ul className="space-y-4">
      {visibleActivities.map(activity => 
        (
        <li key={activity.id}>
            <div className="flex flex-col gap-1 rounded-md border border-stone-200 bg-white p-4">
              <h3 className="text-base font-semibold text-zinc-900">{activity.name}</h3>
              <small className="text-sm text-zinc-600">
                {formatActivityMeta(activity)}
              </small>
            </div>
        </li>)
        )
      }
    </ul>
    : <div className="flex flex-col gap-1 rounded-md border border-stone-200 bg-white p-4">
        <p className="text-base text-zinc-900">No recent Strava activities available yet.</p>
      </div>}
  </section>
} 
