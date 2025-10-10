"use client"

import React, { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { User, Target, Lightbulb } from "lucide-react"
import clsx from "clsx"

export default function EmployeeGapAnalysis() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [employee, setEmployee] = useState<any | null>(null)
  const [successRoles, setSuccessRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Normalize role object to { role_name, ... }
  const normalizeRoles = (arr: any[]) =>
    arr.map((r) => ({
      role_name: (r.role || r.role_name || r.roleTitle || "").toString(),
      ...r,
    }))

  useEffect(() => {
    async function loadInitial() {
      try {
        const empRes = await apiGet("/api/employee/me")
        if (empRes.ok) {
          const empData = await empRes.json()
          setEmployee(empData)
        }

        const rolesRes = await apiGet("/api/employee/success-profile")
        if (rolesRes.ok) {
          const json = await rolesRes.json()
          const rolesArray = Array.isArray(json) ? json : json?.profiles || json?.data || []
          const valid = normalizeRoles(Array.isArray(rolesArray) ? rolesArray : [])
            .filter((r) => typeof r.role_name === "string" && r.role_name.trim() !== "")

          setSuccessRoles(valid)
          if (valid.length > 0) setSelectedRole(valid[0].role_name)
        } else {
          // rolesRes not ok
          setSuccessRoles([])
        }
      } catch (err) {
        console.error("Error loading initial data:", err)
        setSuccessRoles([])
      } finally {
        setLoadingInitial(false)
      }
    }
    loadInitial()
  }, [])

  // Colors for bars based on gap severity
  const getBarColor = (employeeVal: number, requiredVal: number) => {
    const diff = requiredVal - employeeVal
    if (diff <= 0) return "from-emerald-400/80 to-emerald-500/60"
    if (diff <= 5) return "from-blue-400/60 to-blue-500/40"
    if (diff <= 15) return "from-amber-400/60 to-amber-500/40"
    return "from-rose-400/70 to-rose-500/50"
  }

  const getStatusBadge = (employeeVal: number, requiredVal: number) => {
    const diff = employeeVal - requiredVal // positive means surplus
    if (requiredVal === 0) return { label: "N/A", cls: "bg-gray-100 text-gray-800" }
    if (diff >= 0) return { label: `OK (+${diff})`, cls: "bg-emerald-100 text-emerald-700" }
    if (Math.abs(diff) <= 5) return { label: `Near (${diff})`, cls: "bg-amber-100 text-amber-800" }
    return { label: `Gap (${diff})`, cls: "bg-rose-100 text-rose-700" }
  }

  const safePercent = (employeeVal: number, requiredVal: number) => {
    if (!requiredVal || requiredVal === 0) {
      // if required is zero but employee has some value, treat as 100%
      return employeeVal > 0 ? 100 : 0
    }
    const p = Math.round((employeeVal / requiredVal) * 100)
    return Math.max(0, Math.min(100, p))
  }

  // Trigger the analysis API
  const fetchGapAnalysis = async () => {
    if (!employee || !selectedRole) return
    setLoading(true)
    setData(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/gap-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "skip_zrok_interstitial": "1",
        },
        body: JSON.stringify({
          employee_id: employee._id || employee.id || employee.employee_id,
          role_name: selectedRole,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        console.error("Gap analysis failed:", res.status)
      }
    } catch (err) {
      console.error("Error fetching gap analysis:", err)
    } finally {
      setLoading(false)
    }
  }


  // Initial loading state
  if (loadingInitial)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    )

  if (!employee)
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Unable to load your profile.
      </Card>
    )

  // Render
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Gap Analysis</h2>

      {/* Role selection */}
      <Card className="border border-border/40 shadow-sm p-4">
        <label className="font-medium">Select Target Success Role</label>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="w-full md:w-1/2 space-y-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent side="right" sideOffset={6} align="start" className="w-80 h-80 overflow-auto">
                    {Array.isArray(successRoles) && successRoles.length > 0 ? (
                        successRoles.map((r) => (
                            <SelectItem key={r.role_name} value={r.role_name || `role-${r.role_name}`}>
                                {r.role_name}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="no_roles" disabled>
                            No roles found
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 md:gap-4 w-full md:w-auto">
            <Button onClick={fetchGapAnalysis} disabled={loading || !selectedRole} className="w-full md:w-auto">
              {loading ? "Analyzing..." : "Run Gap Analysis"}
            </Button>
          </div>
        </div>
      </Card>

      {/* If analysis not fetched yet, show employee + target quick info only */}
      {!data && !loading && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="flex items-center gap-2 pb-3">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="font-medium">Employee</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-3 text-sm leading-relaxed">
              <p><strong>Name:</strong> {employee.name || employee.fullName || "—"}</p>
              <p><strong>Current Role:</strong> {employee.role || "—"}</p>
              <p><strong>Experience:</strong> {employee.experience_years ?? employee.years ?? "—"} years</p>
            </CardContent>
          </Card>

          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="flex items-center gap-2 pb-3">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="font-medium">Target Role (selected)</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-3 text-sm leading-relaxed">
              <p><strong>Role:</strong> {selectedRole || "—"}</p>
              <p className="text-muted-foreground text-sm">Run the analysis to see the full gap breakdown.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Render full analysis */}
      {!loading && data && (
        <>
          {/* Top summary row */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overall Skill Match</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold">
                      {data.gap_analysis?.overall_skill_match ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">higher is better</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Experience</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 text-sm">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">You</div>
                    <div className="font-medium">{data.employee_info?.experience_years ?? employee.experience_years ?? "—"} yrs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Required</div>
                    <div className="font-medium">{data.target_role_info?.required_experience ?? "—"} yrs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Skills (matched / missing)</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 text-sm">
                <div className="flex gap-4 items-center">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{(data.gap_analysis?.matched_skills || []).length}</div>
                    <div className="text-xs text-muted-foreground">Matched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{(data.gap_analysis?.missing_skills || []).length}</div>
                    <div className="text-xs text-muted-foreground">Missing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Score and Rating comparisons */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Score Gaps */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="flex items-center gap-2 pb-3">
                <Lightbulb className="h-4 w-4 text-primary" />
                <CardTitle className="font-medium">Score Comparison</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-4">
                {data.gap_analysis && data.gap_analysis.score_gaps ? (
                  Object.entries(data.gap_analysis.score_gaps).map(([key, val]: any) => {
                    const emp = Number(val.employee ?? 0)
                    const req = Number(val.required ?? 0)
                    const percent = safePercent(emp, req)
                    const status = getStatusBadge(emp, req)
                    const gap = emp - req
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium capitalize">{key}</div>
                          <div className={clsx("text-xs px-2 py-1 rounded-md", status.cls)}>{status.label}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted/30 rounded-md h-3 overflow-hidden">
                            <div
                              className={clsx("h-3 rounded-md bg-gradient-to-r", getBarColor(emp, req))}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="w-28 text-xs text-muted-foreground text-right">
                            {emp}/{req}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Gap: {gap >= 0 ? `+${gap}` : gap}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No score gaps available.</div>
                )}
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="flex items-center gap-2 pb-3">
                <CardTitle className="font-medium">Ratings Comparison</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-4">
                {data.gap_analysis && data.gap_analysis.rating_gaps ? (
                  Object.entries(data.gap_analysis.rating_gaps).map(([key, val]: any) => {
                    // val.employee and val.required are floats like 2.08 and 3.4
                    const emp = Number(val.employee ?? 0)
                    const req = Number(val.required ?? 0)
                    // convert to percent relative scale (e.g. out of 5)
                    const percent = safePercent(emp, req)
                    const status = getStatusBadge(emp, req)
                    const gapNum = emp - req
                    const gap = gapNum.toFixed(2)
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium capitalize">{key}</div>
                          <div className={clsx("text-xs px-2 py-1 rounded-md", status.cls)}>{status.label}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted/30 rounded-md h-3 overflow-hidden">
                            <div
                              className={clsx("h-3 rounded-md bg-gradient-to-r", getBarColor(emp * 20, req * 20))}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="w-28 text-xs text-muted-foreground text-right">
                            {emp}/{req}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">Gap: {gapNum >= 0 ? `+${gap}` : gap}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No rating gaps available.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Matched / Missing skills + Recommendations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-medium">Skills</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Matched Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {(data.gap_analysis?.matched_skills || []).length === 0 ? (
                      <div className="text-xs text-muted-foreground">None</div>
                    ) : (
                      data.gap_analysis.matched_skills.map((s: string) => (
                        <span
                          key={s}
                          className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Missing Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {(data.gap_analysis?.missing_skills || []).length === 0 ? (
                      <div className="text-xs text-muted-foreground">None</div>
                    ) : (
                      data.gap_analysis.missing_skills.map((s: string) => (
                        <span key={s} className="px-2 py-1 bg-rose-500/10 text-rose-600 rounded-md text-xs font-medium">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-medium">Recommendations</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-3">
                {data.gap_analysis?.recommendations?.length ? (
                  <ul className="list-disc pl-5 text-sm space-y-3">
                    {data.gap_analysis.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start justify-between gap-3">
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No recommendations found.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
