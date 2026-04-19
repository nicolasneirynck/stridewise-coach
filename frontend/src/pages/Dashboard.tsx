import useSWR from "swr"
import {
  BASE_COACH_RESULT_KEY,
  requestBaseCoachResult,
  requestTargetHeartRateActivities,
  requestWeeklyRunningVolumeData,
} from "../features/activities/api/activities"
import WeeklyTrainingLoadChart from "../features/activities/components/WeeklyTrainingLoadChart"
import PaceEvolutionChart from "../features/activities/components/PaceEvolutionChart"
import HeartRateRangeSlider from "../features/activities/components/HeartRateRangeSlider"
import { useEffect, useState } from "react"
import { BaseCoachOverviewCard } from "../features/activities/components/BaseCoachOverviewCard"


type TimeRangeOption = 'lastYear' | 'last6Months' | 'last3Months'
type ActivityNameFilterOption = 'General Aerobic Run' | 'Endurance Run' | 'Recovery Run'

const TIME_RANGE_LABELS: Record<TimeRangeOption, string> = {
  lastYear: 'Last year',
  last6Months: 'Last 6 months',
  last3Months: 'Last 3 months',
}

const ACTIVITY_NAME_FILTER_OPTIONS: ActivityNameFilterOption[] = [
  'General Aerobic Run',
  'Endurance Run',
  'Recovery Run',
]

function getRangeStartDate(range: TimeRangeOption, now: Date): Date {
  const start = new Date(now)

  if (range === 'lastYear') {
    start.setUTCFullYear(start.getUTCFullYear() - 1)
    return start
  }

  if (range === 'last6Months') {
    start.setUTCMonth(start.getUTCMonth() - 6)
    return start
  }

  start.setUTCMonth(start.getUTCMonth() - 3)
  return start
}

export function Dashboard() {
  const initialHeartRateInterval = { minHeartRate: 140, maxHeartRate: 150 }
  const weeklyLoadRangeEndDate = new Date()
  const weeklyLoadRangeStartDate = new Date(weeklyLoadRangeEndDate)
  weeklyLoadRangeStartDate.setUTCFullYear(weeklyLoadRangeStartDate.getUTCFullYear() - 1)

  const {
    data: weeklyLoad,
    error: weeklyLoadError,
    isLoading: isWeeklyLoadLoading,
  } = useSWR('activities/weekly-running-volume', requestWeeklyRunningVolumeData)

  const {
    data: baseCoachResult,
    error: baseCoachResultError,
    isLoading: isBaseCoachResultLoading,
  } = useSWR(BASE_COACH_RESULT_KEY, requestBaseCoachResult)


  const linePoints = weeklyLoad === undefined
  ? []
  : weeklyLoad
      .filter((load) => {
        const weekStartDate = new Date(`${load.weekStartDate}T00:00:00.000Z`)

        return weekStartDate >= weeklyLoadRangeStartDate && weekStartDate <= weeklyLoadRangeEndDate
      })
      .map((load) => ({
        weekStartDate: load.weekStartDate,
        weekStartTimestamp: new Date(`${load.weekStartDate}T00:00:00.000Z`).getTime(),
        totalLoad: load.totalRunningDistance,
      }))

  const renderBaseCoachOverview = () => {
    if (isBaseCoachResultLoading) {
      return <p className="mt-8 text-sm text-zinc-600">Loading base coach result...</p>
    }

    if (baseCoachResultError) {
      return (
        <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {baseCoachResultError instanceof Error
            ? baseCoachResultError.message
            : 'Unable to load base coach result.'}
        </p>
      )
    }

    if (!baseCoachResult) {
      return (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            No base coach result yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Import running activities first, then the coach overview will appear here.
          </p>
        </div>
      )
    }


    return (
      <div className="mt-8">
        <BaseCoachOverviewCard baseCoachResult={baseCoachResult} />
      </div>
    )
  }


  const renderWeeklyLoadSection = () => {
    if (isWeeklyLoadLoading){
      return (<p>still loading</p>)
    }
    if (weeklyLoadError){
      return (<p>{weeklyLoadError.message}</p>)
    }
    if (weeklyLoad && weeklyLoad.length === 0){
      return (<p>No weekly training load data yet</p>)
    }
    return <div className="mt-14 border-t border-stone-200 pt-10">
              <h3>Weekly training load</h3>
              <WeeklyTrainingLoadChart
                points={linePoints}
                rangeStartDate={weeklyLoadRangeStartDate}
                rangeEndDate={weeklyLoadRangeEndDate}
              />
            </div>

  }

  const [heartRateInterval, setHeartRateInterval] = useState<{ minHeartRate: number; maxHeartRate: number }>(initialHeartRateInterval)
  const [draftHeartRateInterval, setDraftHeartRateInterval] = useState<{ minHeartRate: number; maxHeartRate: number }>(initialHeartRateInterval)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeOption>('last6Months')
  const [selectedActivityNameFilters, setSelectedActivityNameFilters] = useState<ActivityNameFilterOption[]>([])
  const isHeartRateRangeInvalid = heartRateInterval.minHeartRate > heartRateInterval.maxHeartRate
  const rangeEndDate = new Date()
  const rangeStartDate = getRangeStartDate(selectedTimeRange, rangeEndDate)

  useEffect(() => {
    setDraftHeartRateInterval(heartRateInterval)
  }, [heartRateInterval])

  const {
    data: targetHeartRateActivities,
    error: targetHeartRateError,
    isLoading: isTargetHeartRateLoading,
  } = useSWR(
    ['activities/running-activities/target-heart-rate', heartRateInterval.minHeartRate, heartRateInterval.maxHeartRate],
    () => requestTargetHeartRateActivities(heartRateInterval)
  )


  const paceEvolutionPoints = targetHeartRateActivities === undefined
    ? []
    : targetHeartRateActivities
        .filter((activity) => {
          const activityDate = new Date(activity.startDate)
          const matchesSelectedNameFilter =
            selectedActivityNameFilters.length === 0 ||
            selectedActivityNameFilters.some((filterOption) =>
              activity.name.includes(filterOption)
            )

          return (
            activityDate >= rangeStartDate &&
            activityDate <= rangeEndDate &&
            matchesSelectedNameFilter
          )
        })
        .map((activity) => ({
          id: activity.id,
          name: activity.name,
          date: activity.startDate,
          dateTimestamp: new Date(activity.startDate).getTime(),
          averageHeartRate: activity.averageHeartRate,
          pace: activity.averagePace,
          distance: activity.distance,
        }))

  const renderTargetHeartRateSection = () => {
    let content

    if (isHeartRateRangeInvalid) {
      content = null
    } else if (isTargetHeartRateLoading) {
      content = <p>loading</p>
    } else if (targetHeartRateError) {
      content = <p>{targetHeartRateError.message}</p>
    } else if (paceEvolutionPoints.length === 0) {
      content = <p>No target heart rate activities yet</p>
    } else {
      content = (
        <PaceEvolutionChart
          points={paceEvolutionPoints}
          rangeStartDate={rangeStartDate}
          rangeEndDate={rangeEndDate}
        />
      )
    }

    const toggleActivityNameFilter = (filterOption: ActivityNameFilterOption) => {
      setSelectedActivityNameFilters((currentFilters) =>
        currentFilters.includes(filterOption)
          ? currentFilters.filter((currentFilter) => currentFilter !== filterOption)
          : [...currentFilters, filterOption]
      )
    }

    return <div className="space-y-6">
              <div>
                <h3>Target heart rate activities</h3>
                <p className="text-sm text-zinc-600">
                  Analyze pace evolution for a selected heart rate zone.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Filter by period
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(['lastYear', 'last6Months', 'last3Months'] as TimeRangeOption[]).map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setSelectedTimeRange(range)}
                          className={
                            selectedTimeRange === range
                              ? "rounded-md bg-orange-500 px-3 py-2 text-sm text-white"
                              : "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                          }
                        >
                          {TIME_RANGE_LABELS[range]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Filter by workout type
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_NAME_FILTER_OPTIONS.map((filterOption) => (
                        <button
                          key={filterOption}
                          type="button"
                          onClick={() => toggleActivityNameFilter(filterOption)}
                          className={
                            selectedActivityNameFilters.includes(filterOption)
                              ? "rounded-md bg-zinc-900 px-3 py-2 text-sm text-white"
                              : "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                          }
                        >
                          {filterOption}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Filter by heart rate range
                    </p>
                    <HeartRateRangeSlider
                      min={80}
                      max={200}
                      value={[draftHeartRateInterval.minHeartRate, draftHeartRateInterval.maxHeartRate]}
                      onChange={([minHeartRate, maxHeartRate]) =>
                        setDraftHeartRateInterval({ minHeartRate, maxHeartRate })
                      }
                      onCommit={([minHeartRate, maxHeartRate]) =>
                        setHeartRateInterval({ minHeartRate, maxHeartRate })
                      }
                    />
                  </div>
                </div>
              </div>
              {isHeartRateRangeInvalid && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Minimum heart rate must be lower than or equal to maximum heart rate.
                </p>
              )}
              <div>{content}</div>
            </div>
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        StrideWise Coach
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
        Dashboard
      </h1>
      {renderBaseCoachOverview()}
      <div className="mt-14">
        {renderTargetHeartRateSection()}
      </div>
      {renderWeeklyLoadSection()}
    </section>
  )
}
