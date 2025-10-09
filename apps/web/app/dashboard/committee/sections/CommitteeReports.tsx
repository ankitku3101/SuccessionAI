import { apiGet } from "@/lib/api"
import { useEffect, useState } from "react"

export default function CommitteeReports() {
  const [summary, setSummary] = useState<any | null>(null)
  
  useEffect(() => {
    async function load() {
      const res = await apiGet("/api/committee/reports/summary")
      if (res.ok) setSummary(await res.json())
    }
    load()
  }, [])
  
  if (!summary) return null
  
  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Reports Summary</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-medium mb-1">By Department</h3>
          <ul className="list-disc pl-5 text-sm">
            {summary.byDepartment?.map((d: any) => (
              <li key={d._id}>
                {d._id || "—"}: {d.count} employees, Avg Perf {Math.round((d.avgPerf || 0) * 10) / 10}, Avg Pot{" "}
                {Math.round((d.avgPot || 0) * 10) / 10}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-1">Readiness By Role</h3>
          <ul className="list-disc pl-5 text-sm">
            {summary.readinessByRole?.map((r: any) => (
              <li key={r._id}>
                {r._id || "—"}: {r.count} employees, Avg Perf {Math.round((r.avgPerf || 0) * 10) / 10}, Avg Pot{" "}
                {Math.round((r.avgPot || 0) * 10) / 10}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}