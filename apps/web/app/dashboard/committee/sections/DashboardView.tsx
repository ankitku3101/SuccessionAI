"use client"

import React, { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"

export default function DashboardView() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      const res = await apiGet("/api/committee/reports/summary")
      if (res.ok) setStats(await res.json())
    }
    loadStats()
  }, [])

  const totalEmployees = stats?.byDepartment?.reduce((acc: number, d: any) => acc + d.count, 0) || 0
  const avgPerformance =
    stats?.byDepartment?.reduce((acc: number, d: any) => acc + (d.avgPerf || 0), 0) /
      (stats?.byDepartment?.length || 1) || 0
  const avgPotential =
    stats?.byDepartment?.reduce((acc: number, d: any) => acc + (d.avgPot || 0), 0) /
      (stats?.byDepartment?.length || 1) || 0
  const readyForPromotion =
    stats?.readinessByRole
      ?.filter((r: any) => r.avgPerf >= 4.0 && r.avgPot >= 4.0)
      .reduce((acc: number, r: any) => acc + r.count, 0) || 0

  return (
    <>
      <h2 className="font-semibold text-lg mb-2">Dashboard Overview</h2>
      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees" value={totalEmployees} />
        <StatCard title="Average Performance" value={avgPerformance.toFixed(1)} />
        <StatCard title="Average Potential" value={avgPotential.toFixed(1)} />
        <StatCard title="Ready for Promotion" value={readyForPromotion} />
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h3 className="font-semibold text-lg mb-4">Quick Stats by Department</h3>
        <div className="space-y-3">
          {stats?.byDepartment?.map((d: any) => (
            <div key={d._id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <span className="font-medium">{d._id || "Unassigned"}</span>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{d.count} employees</span>
                <span>Perf: {d.avgPerf?.toFixed(1)}</span>
                <span>Pot: {d.avgPot?.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="text-sm text-muted-foreground mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
