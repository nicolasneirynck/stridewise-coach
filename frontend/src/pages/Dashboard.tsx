import useSWR from "swr"
import { requestRunningGraphData } from "../features/activities/api/activities"
import HeartRateVsPaceChart from "../features/activities/components/HeartRateVsPaceChart"

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

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        StrideWise Coach
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
        Dashboard
      </h1>
      {renderChartSection()}
    </section>
  )
}
