"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiGet, apiPost } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { User, Target, TrendingUp, Award, AlertCircle, CheckCircle2, XCircle, BarChart3, Sparkles } from "lucide-react"
import clsx from "clsx"

export default function EmployeeGapAnalysis() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [employee, setEmployee] = useState<any | null>(null)
  const [successRoles, setSuccessRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [loadingInitial, setLoadingInitial] = useState(true)

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

  const getBarColor = (employeeVal: number, requiredVal: number) => {
    const diff = requiredVal - employeeVal
    if (diff <= 0) return "bg-gradient-to-r from-green-500 to-emerald-500"
    if (diff <= 5) return "bg-gradient-to-r from-blue-500 to-cyan-500"
    if (diff <= 15) return "bg-gradient-to-r from-amber-500 to-orange-500"
    return "bg-gradient-to-r from-rose-500 to-red-500"
  }

  const getStatusBadge = (employeeVal: number, requiredVal: number) => {
    const diff = employeeVal - requiredVal
    if (requiredVal === 0) return { label: "N/A", cls: "bg-[var(--muted-900)] text-[var(--muted-400)] border-[var(--border)]", icon: AlertCircle }
    if (diff >= 0) return { label: "Met", cls: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2 }
    if (Math.abs(diff) <= 5) return { label: "Close", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertCircle }
    return { label: "Gap", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: XCircle }
  }

  const safePercent = (employeeVal: number, requiredVal: number) => {
    if (!requiredVal || requiredVal === 0) {
      return employeeVal > 0 ? 100 : 0
    }
    const p = Math.round((employeeVal / requiredVal) * 100)
    return Math.max(0, Math.min(100, p))
  }

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

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                  <Skeleton className="h-4 w-24 bg-[var(--muted)]" />
                  <Skeleton className="h-8 w-16 bg-[var(--muted)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--foreground)]">
        <Card className="max-w-md w-full mx-4 bg-[var(--card)] border-[var(--border)]">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-semibold mb-2 text-[var(--foreground)]">Unable to load profile</h3>
            <p className="text-sm text-[var(--muted-foreground)]">There was an error loading your employee profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Gap Analysis</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Compare your skills against target roles</p>
          </div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full space-y-2">
                <div className="text-sm font-medium text-[var(--muted-foreground)]">Target Role</div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] h-9">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
                    {Array.isArray(successRoles) && successRoles.length > 0 ? (
                      successRoles.map((r) => (
                        <SelectItem key={r.role_name} value={r.role_name} className="text-[var(--foreground)] focus:bg-[var(--muted)] focus:text-[var(--foreground)]">
                          {r.role_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no_roles" disabled className="text-[var(--muted-foreground)]">
                        No roles found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={fetchGapAnalysis}
                disabled={loading || !selectedRole}
                className="gap-2 bg-[var(--accent)] hover:opacity-95 text-[var(--button-foreground)] border-0 h-9 px-4 w-full sm:w-auto"
              >
                <BarChart3 className={`w-3.5 h-3.5 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid gap-3 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                      <Skeleton className="h-4 w-24 bg-[var(--muted)]" />
                      <Skeleton className="h-8 w-16 bg-[var(--muted)]" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : data ? (
              <motion.div
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Summary Stats */}
                <div className="grid gap-3 md:grid-cols-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Skill Match</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-3xl font-bold text-[var(--foreground)]">
                        {data.gap_analysis?.overall_skill_match ?? "—"}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Overall compatibility</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Experience</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[var(--foreground)]">
                          {data.employee_info?.experience_years ?? employee.experience_years ?? "—"}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)]">/</span>
                        <span className="text-xl font-semibold text-[var(--muted-foreground)]">
                          {data.target_role_info?.required_experience ?? "—"}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">years</span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Your exp / Required</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Skills</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-6">
                        <div>
                          <div className="text-2xl font-bold text-green-400">
                            {(data.gap_analysis?.matched_skills || []).length}
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">Matched</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-rose-400">
                            {(data.gap_analysis?.missing_skills || []).length}
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">Missing</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Score & Rating Comparison */}
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Scores */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Score Comparison</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {data.gap_analysis && data.gap_analysis.score_gaps ? (
                        Object.entries(data.gap_analysis.score_gaps).map(([key, val]: any, idx) => {
                          const emp = Number(val.employee ?? 0)
                          const req = Number(val.required ?? 0)
                          const percent = safePercent(emp, req)
                          const status = getStatusBadge(emp, req)
                          const StatusIcon = status.icon
                          const gap = emp - req
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03, duration: 0.2 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{key}</span>
                                <div className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border", status.cls)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                                  <div
                                    className={clsx("h-2 rounded-full transition-all", getBarColor(emp, req))}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[var(--muted-foreground)] w-16 text-right">
                                  {emp}/{req}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--muted-foreground)]">Gap: {gap >= 0 ? `+${gap}` : gap}</p>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No score data</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Ratings */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Rating Comparison</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {data.gap_analysis && data.gap_analysis.rating_gaps ? (
                        Object.entries(data.gap_analysis.rating_gaps).map(([key, val]: any, idx) => {
                          const emp = Number(val.employee ?? 0)
                          const req = Number(val.required ?? 0)
                          const percent = safePercent(emp, req)
                          const status = getStatusBadge(emp, req)
                          const StatusIcon = status.icon
                          const gapNum = emp - req
                          const gap = gapNum.toFixed(2)
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03, duration: 0.2 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{key}</span>
                                <div className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border", status.cls)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                                  <div
                                    className={clsx("h-2 rounded-full transition-all", getBarColor(emp * 20, req * 20))}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[var(--muted-foreground)] w-16 text-right">
                                  {emp.toFixed(1)}/{req.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--muted-foreground)]">Gap: {gapNum >= 0 ? `+${gap}` : gap}</p>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No rating data</p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Skills & Recommendations */}
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Skills */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Skills Breakdown</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          Matched Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(data.gap_analysis?.matched_skills || []).length === 0 ? (
                            <span className="text-xs text-[var(--muted-foreground)]">None</span>
                          ) : (
                            data.gap_analysis.matched_skills.map((s: string, i: number) => (
                              <motion.span
                                key={s}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02, duration: 0.2 }}
                                className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-[10px] font-medium border border-green-500/20"
                              >
                                {s}
                              </motion.span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2 flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Missing Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(data.gap_analysis?.missing_skills || []).length === 0 ? (
                            <span className="text-xs text-[var(--muted-foreground)]">None</span>
                          ) : (
                            data.gap_analysis.missing_skills.map((s: string, i: number) => (
                              <motion.span
                                key={s}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02, duration: 0.2 }}
                                className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded text-[10px] font-medium border border-rose-500/20"
                              >
                                {s}
                              </motion.span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="p-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Recommendations</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      {data.gap_analysis?.recommendations?.length ? (
                        <div className="space-y-3">
                          {data.gap_analysis.recommendations.map((r: string, i: number) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                              className="flex items-start gap-2"
                            >
                              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              <p className="text-sm text-[var(--foreground)] leading-relaxed">{r}</p>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No recommendations</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card-muted)]"
              >
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-[var(--muted-foreground)]" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5 text-[var(--foreground)]">No Analysis Yet</h3>
                  <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-4">
                    Select a target role and run the analysis to see detailed skill gaps and recommendations.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}