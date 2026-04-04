import useSWR from "swr"
import { requestRunningGraphData, requestWeeklyLoadData } from "../features/activities/api/activities"
import HeartRateVsPaceChart from "../features/activities/components/HeartRateVsPaceChart"
import WeeklyTrainingLoadChart from "../features/activities/components/WeeklyTrainingLoadChart"

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
    </section>
  )
}
