"use client"

import { apiGet } from "@/lib/api"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, UserCog } from "lucide-react"
import clsx from "clsx"

export default function CommitteeReports() {
  const [summary, setSummary] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGet("/api/committee/reports/summary")
        if (res.ok) setSummary(await res.json())
      } catch (error) {
        console.error("Error loading summary:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    )

  if (!summary)
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No data available at the moment.
      </Card>
    )

  // helper to get color for performance/potential bars
  const getBarColor = (value: number) => {
    if (value >= 8) return "from-emerald-400/80 to-emerald-500/60"
    if (value >= 6) return "from-blue-400/60 to-blue-500/40"
    if (value >= 4) return "from-amber-400/60 to-amber-500/40"
    return "from-rose-400/70 to-rose-500/50"
  }

  const ScrollFadeWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background via-background/80 to-transparent z-10" />
      <ScrollArea className="h-[300px] pr-3 scrollarea">{children}</ScrollArea>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Reports Summary</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By Department */}
        <Card className="border border-border/40 shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              By Department
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-3">
              <div className="space-y-3 text-sm leading-relaxed">
                {summary.byDepartment?.map((d: any) => {
                  const perf = Math.round((d.avgPerf || 0) * 10) / 10
                  const pot = Math.round((d.avgPot || 0) * 10) / 10
                  return (
                    <div
                      key={d._id}
                      className="p-3 rounded-lg border border-border/30 hover:bg-muted/40 transition-colors space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate text-foreground/90">
                          {d._id || "—"}
                        </span>
                        <span className="text-muted-foreground text-xs shrink-0">
                          {d.count} employees
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Performance</span>
                          <span>{perf}</span>
                        </div>
                        <div
                          className={clsx("h-2 w-full rounded-md bg-gradient-to-r", getBarColor(perf))}
                          style={{ width: `${perf * 10}%` }}
                        ></div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Potential</span>
                          <span>{pot}</span>
                        </div>
                        <div
                          className={clsx("h-2 w-full rounded-md bg-gradient-to-r", getBarColor(pot))}
                          style={{ width: `${pot * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
          </CardContent>
        </Card>

        {/* Readiness By Role */}
        <Card className="border border-border/40 shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              Readiness By Role
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-3">
              <div className="space-y-3 text-sm leading-relaxed">
                {summary.readinessByRole?.map((r: any) => {
                  const perf = Math.round((r.avgPerf || 0) * 10) / 10
                  const pot = Math.round((r.avgPot || 0) * 10) / 10
                  return (
                    <div
                      key={r._id}
                      className="p-3 rounded-lg border border-border/30 hover:bg-muted/40 transition-colors space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate text-foreground/90">
                          {r._id || "—"}
                        </span>
                        <span className="text-muted-foreground text-xs shrink-0">
                          {r.count} employees
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Performance</span>
                          <span>{perf}</span>
                        </div>
                        <div
                          className={clsx("h-2 w-full rounded-md bg-gradient-to-r", getBarColor(perf))}
                          style={{ width: `${perf * 10}%` }}
                        ></div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Potential</span>
                          <span>{pot}</span>
                        </div>
                        <div
                          className={clsx("h-2 w-full rounded-md bg-gradient-to-r", getBarColor(pot))}
                          style={{ width: `${pot * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
