import useSWR from 'swr'
import { Bike, Dumbbell, Footprints,Activity } from 'lucide-react'
import Error from '../components/ui/Error'
import Loader from '../components/ui/Loader'
import {
  requestStoredActivities,
  type StoredActivity,
} from '../features/activities/api/activities'
import type { ActivityType, ActivityTypeFilter } from '../features/activities/api/activities'
import { useState } from 'react'


const activityTypeFilters: Array<{
  value: ActivityTypeFilter
  label: string
}> = [
  { value: 'all', label: 'All activities' },
  { value: 'run', label: 'Runs' },
  { value: 'hike', label: 'Hikes' },
  { value: 'bike', label: 'Bike rides' },
  { value: 'strengthtraining', label: 'Strength training' },
]

function formatActivityDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function ActivityTypeIcon({ activityType }: { activityType: ActivityType }) {
  switch (activityType) {
    case 'run':
      return <Activity aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
    case 'bike':
      return <Bike aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
    case 'hike':
      return <Footprints aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
    case 'strengthtraining':
      return <Dumbbell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
  }
}

function formatActivityTypeLabel(activityType: ActivityType): string {
  switch (activityType) {
    case 'run':
      return 'Run'
    case 'bike':
      return 'Bike'
    case 'hike':
      return 'Hike'
    case 'strengthtraining':
      return 'Strength Training'
  }
}

function formatDuration(durationInSeconds: number): string {
  if (durationInSeconds < 60) {
    return `${durationInSeconds}s`
  }

  const hours = Math.floor(durationInSeconds / 3600)
  const minutes = Math.floor((durationInSeconds % 3600) / 60)
  const seconds = durationInSeconds % 60

  if (hours === 0) {
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
  }

  if (minutes === 0 && seconds === 0) {
    return `${hours}h`
  }

  if (seconds === 0) {
    return `${hours}h ${minutes}m`
  }

  return `${hours}h ${minutes}m ${seconds}s`
}

function formatDistance(distanceInMeters: number): string {
  return `${(distanceInMeters / 1000).toFixed(2)} km`
}

function ActivityCard({ activity }: { activity: StoredActivity }) {
  const activityTypeLabel = formatActivityTypeLabel(activity.type)

  return (
    <li className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{activity.name}</h2>
          <div
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-zinc-900/5 px-3 py-2 text-sm font-medium text-zinc-700"
            aria-label={activityTypeLabel}
            title={activityTypeLabel}
          >
            <ActivityTypeIcon activityType={activity.type} />
            <span>{activityTypeLabel}</span>
          </div>
        </div>

        <div className="text-sm text-zinc-600 md:text-right">
          <p>{formatActivityDate(activity.startDate)}</p>
          <p className="mt-1 font-medium text-zinc-900">
              {formatDuration(activity.duration)}
            </p> 
         {activity.distance > 0 
          ? <p className="mt-1 font-medium text-zinc-900">
              {formatDistance(activity.distance)}
            </p> 
          : null}
        </div>
      </div>
    </li>
  )
}

export function ActivitiesPage() {
  
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityTypeFilter>('all')
  const {
    data: activities,
    error,
    isLoading,
  } = useSWR(['activities',activityTypeFilter], () => requestStoredActivities(activityTypeFilter))

  const activityList = activities ?? []
  const hasActivities = activityList.length > 0

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Activities
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
        Stored activities
      </h1>
      <div>
        <p className="mt-3 mb-3 text-sm font-medium text-zinc-600">Filter by activity type</p>
        <div className='flex flex-wrap gap-2'>
          {activityTypeFilters.map((filterOption) => {
            const isActive = activityTypeFilter === filterOption.value
            
            return (
            <button
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                  : 'border-stone-200 bg-stone-50 text-zinc-700 hover:border-stone-300 hover:bg-stone-100',
                ].join(' ')}
              key={filterOption.value}
              type="button"
              onClick={() => setActivityTypeFilter(filterOption.value)}
            >
              {filterOption.label}
            </button>
          )})}
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? <Loader /> : null}
        {error ? <Error error={error} /> : null}

        {!isLoading && !error && !hasActivities ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              No stored activities yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Import activities from Strava first, then come back here to verify
              they were saved.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && hasActivities ? (
          <div>
            <p className="mb-4 text-sm text-zinc-600">
              {activityList.length} stored {activityList.length === 1 ? 'activity' : 'activities'}
            </p>
            <ul className="space-y-4">
              {activityList.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
