"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { apiGet } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, TrendingUp, Target, Award, Building, Activity, Brain, BarChart2 } from "lucide-react"
import clsx from "clsx"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// --- MAIN DASHBOARD COMPONENT ---
export default function DashboardView() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiGet("/api/committee/reports/summary")
        if (res.ok) {
          setStats(await res.json())
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const totalEmployees = stats?.byDepartment?.reduce((acc: number, d: any) => acc + d.count, 0) || 0
  const totalPerfSum = stats?.byDepartment?.reduce((acc: number, d: any) => acc + (d.avgPerf || 0) * d.count, 0) || 0
  const avgPerformance = totalEmployees > 0 ? totalPerfSum / totalEmployees : 0
  const totalPotSum = stats?.byDepartment?.reduce((acc: number, d: any) => acc + (d.avgPot || 0) * d.count, 0) || 0
  const avgPotential = totalEmployees > 0 ? totalPotSum / totalEmployees : 0
  const readyForPromotion =
    stats?.readinessByRole
      ?.filter((r: any) => r.avgPerf >= 4.0 && r.avgPot >= 4.0)
      .reduce((acc: number, r: any) => acc + r.count, 0) || 0

  return (
    <div className="h-full overflow-y-auto bg-background p-4 transition-colors">
      <motion.div
        className="max-w-[1800px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          All Employees Overview
        </h2>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            color="text-sky-500"
          />
          <StatCard
            title="Avg. Performance"
            value={avgPerformance.toFixed(2)}
            icon={TrendingUp}
            color="text-emerald-500"
          />
          <StatCard
            title="Avg. Potential"
            value={avgPotential.toFixed(2)}
            icon={Target}
            color="text-amber-500"
          />
          <StatCard
            title="Promotion Ready"
            value={readyForPromotion}
            icon={Award}
            color="text-violet-500"
          />
        </div>

        {/* Department Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2">
            <DepartmentCharts data={stats?.byDepartment || []} />
          </div>

          {/* Detailed List Section */}
          <div className="lg:col-span-3">
            <Card className="border-border bg-card hover:border-muted transition-all h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building className="h-5 w-5 text-violet-400" />
                  Department Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {stats?.byDepartment?.length > 0 ? (
                    stats.byDepartment.map((d: any) => (
                      <DepartmentStatRow key={d._id} department={d} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No department data available.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )

}

// --- NEW CHART COMPONENT ---
function DepartmentCharts({ data }: { data: any[] }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      setIsDark(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [])

  const chartData = data.map((d) => ({
    name: d._id || "Unassigned",
    Employees: d.count,
    Performance: parseFloat(d.avgPerf?.toFixed(2) || "0"),
    Potential: parseFloat(d.avgPot?.toFixed(2) || "0"),
  }))

  // Adjust colors for dark/light themes
  const barColors = {
    employees: isDark ? "#38bdf8" : "hsl(var(--primary))", // sky for dark mode
    performance: isDark ? "#34d399" : "#10b981", // emerald
    potential: isDark ? "#fbbf24" : "#f59e0b", // amber
    grid: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    text: isDark ? "#e5e7eb" : "#374151",
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart2 className="h-5 w-5 text-violet-400" />
          Department Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Employee Distribution */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Employee Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={barColors.grid} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke={barColors.text} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} stroke={barColors.text} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="Employees" fill={barColors.employees} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Ratings */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Ratings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={barColors.grid} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke={barColors.text} />
              <YAxis type="number" domain={[0, 5]} fontSize={12} tickLine={false} axisLine={false} stroke={barColors.text} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "14px", color: barColors.text }} />
              <Bar dataKey="Performance" fill={barColors.performance} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Potential" fill={barColors.potential} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}



// --- EXISTING CHILD COMPONENTS (UNCHANGED) ---

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number | string, icon: React.ElementType, color: string }) {
  return (
    <Card className="border-border bg-card hover:border-muted transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={clsx("h-5 w-5", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

function DepartmentStatRow({ department }: { department: { _id: string, count: number, avgPerf?: number, avgPot?: number } }) {
  const perf = department.avgPerf || 0
  const pot = department.avgPot || 0
  const getRatingColor = (value: number) => {
    if (value >= 4.0) return "bg-emerald-500";
    if (value >= 2.5) return "bg-amber-500";
    return "bg-rose-500";
  }

  return (
    <div className="grid grid-cols-12 items-center gap-4 p-4 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="col-span-12 md:col-span-4 flex items-center gap-3">
        <span className="font-semibold text-foreground truncate">{department._id || "Unassigned"}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{department.count} employees</span>
      </div>
      <div className="col-span-6 md:col-span-4">
        <RatingIndicator label="Performance" value={perf} color={getRatingColor(perf)} icon={Activity}/>
      </div>
      <div className="col-span-6 md:col-span-4">
        <RatingIndicator label="Potential" value={pot} color={getRatingColor(pot)} icon={Brain}/>
      </div>
    </div>
  )
}

function RatingIndicator({ label, value, color, icon: Icon }: { label: string; value: number, color: string, icon: React.ElementType }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="text-xs font-semibold text-foreground">{value.toFixed(2)}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={clsx("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${(value / 5) * 100}%` }} // Assuming max rating is 5
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// --- SKELETON COMPONENT (UPDATED FOR NEW LAYOUT) ---
function DashboardSkeleton() {
  return (
    <div className="h-full overflow-auto bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Skeleton for Charts */}
          <Card className="lg:col-span-2">
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          {/* Skeleton for List */}
          <Card className="lg:col-span-3">
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}