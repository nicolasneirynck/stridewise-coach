import useSWR from "swr"
import {
  requestRunningGraphData,
  requestTargetHeartRateActivities,
  requestWeeklyLoadData,
} from "../features/activities/api/activities"
import HeartRateVsPaceChart from "../features/activities/components/HeartRateVsPaceChart"
import WeeklyTrainingLoadChart from "../features/activities/components/WeeklyTrainingLoadChart"
import PaceEvolutionChart from "../features/activities/components/PaceEvolutionChart"

export function Dashboard() {
  const {
    data: runningGraph,
    error,
    isLoading,
  } = useSWR('activities/running-graph',requestRunningGraphData)

  const chartPoints = runningGraph === undefined ? [] : runningGraph.map(activity => ({
    pace: activity.averagePace,
    heartRate: activity.averageHeartRate,
    startDate: activity.startDate
  }))

  const renderChartSection = () => {
    if (isLoading){
      return (<p>still loading</p>)
    }
    if (error){
      return (<p>{error.message}</p>)
    }
    if (chartPoints && chartPoints.length === 0){
      return (<p>No running graph data yet</p>)
    }
    return <div>
              <h3>Heart rate vs pace</h3>
              <p>Each point represents one run.</p>
              <HeartRateVsPaceChart points={chartPoints} />
            </div>
  }

  const {
    data: weeklyLoad,
    error: weeklyLoadError,
    isLoading: isWeeklyLoadLoading,
  } = useSWR('activities/weekly-load',requestWeeklyLoadData)

   const linePoints = weeklyLoad === undefined ? [] : weeklyLoad.map(load => ({
    weekStartDate: load.weekStartDate,
    totalLoad: load.totalLoad,
  }))

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
    return <div>
              <h3>Weekly training load</h3>
              <WeeklyTrainingLoadChart points={linePoints}/>
            </div>

  }

  const {
    data: targetHeartRateActivities,
    error: targetHeartRateError,
    isLoading: isTargetHeartRateLoading,
  } = useSWR('activities/running-activities/target-heart-rate', requestTargetHeartRateActivities)

  const paceEvolutionPoints = targetHeartRateActivities === undefined
    ? []
    : targetHeartRateActivities.map((activity) => ({
        id: activity.id,
        date: activity.startDate,
        pace: activity.averagePace,
      }))

  const renderTargetHeartRateSection = () => {
    if (isTargetHeartRateLoading) {
      return <p>loading</p>
    }

    if (targetHeartRateError) {
      return <p>{targetHeartRateError.message}</p>
    }

    if (paceEvolutionPoints.length === 0) {
      return <p>No target heart rate activities yet</p>
    }

    return <div>
              <h3>Target heart rate activities</h3>
              <PaceEvolutionChart points={paceEvolutionPoints}/>
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
      {renderChartSection()}
      {renderWeeklyLoadSection()}
      {renderTargetHeartRateSection()}
    </section>
  )
}
