"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User, TrendingUp, Target, Award, Activity, Calendar, Brain } from "lucide-react"
import clsx from "clsx"
import { apiGet } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { motion } from "framer-motion"

type Profile = {
  id: number
  name: string
  role: string
  designation?: string
  department?: string
  skills?: string[]
  mentorship?: {
    mentor_id: string
    status: string
  }
  assessment_scores?: {
    technical?: number
    communication?: number
    leadership?: number
  }
  performance_rating?: number
  potential_rating?: number
  num_trainings?: number
  [key: string]: any
}

type Segment = {
  segment_label: string
}

type ReadinessResponse = {
  employee_info?: {
    performance_rating?: number
    potential_rating?: number
  }
  input_features?: {
    leadership_score?: number
    technical_score?: number
    communication_score?: number
    experience_years?: number
  }
  prediction: {
    readiness_status: string
    confidence?: number
    probabilities: {
      Developing: number
      "Not Ready": number
      Ready: number
    }
  }
}

const SEGMENTS = [
  ["Enigma", "Emerging Talent", "Star"],
  ["Inconsistent Player", "Core Contributor", "Consistent Performer"],
  ["Risk Zone", "Diligent Worker", "Solid Performer"]
]

const STATUS_COLORS = {
  Ready: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    fill: "bg-emerald-500"
  },
  Developing: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    fill: "bg-amber-500"
  },
  "Not Ready": {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    border: "border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    fill: "bg-rose-500"
  }
}

export default function DashboardView({ profile: initialProfile }: { profile?: Profile }) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null)
  const [segment, setSegment] = useState<Segment | null>(null)
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [profileLoading, setProfileLoading] = useState(true)
  const [readinessLoading, setReadinessLoading] = useState(true)
  const [segmentLoading, setSegmentLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user) return
    const userId = user.id

    async function fetchData() {
      try {
        const [me, seg, ready] = await Promise.allSettled([
          !profile ? apiGet("/api/employee/me") : null,
          fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/segment/single`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "skip_zrok_interstitial": "1" },
            body: JSON.stringify({ employee_id: userId }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/readiness/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "skip_zrok_interstitial": "1" },
            body: JSON.stringify({ employee_id: userId }),
          }),
        ])

        if (me.status === "fulfilled" && me.value?.ok) {
          const data: Profile = await me.value.json()
          setProfile(data)
        }
        setProfileLoading(false)

        if (seg.status === "fulfilled" && seg.value?.ok) {
          const segData: Segment = await seg.value.json()
          setSegment(segData)
        }
        setSegmentLoading(false)

        if (ready.status === "fulfilled" && ready.value?.ok) {
          const data: ReadinessResponse = await ready.value.json()
          setReadiness(data)
        }
        setReadinessLoading(false)
      } catch (error) {
        console.error("Dashboard load error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile])

  const readyProb = (readiness?.prediction?.probabilities?.Ready || 0) * 100
  const developingProb = (readiness?.prediction?.probabilities?.Developing || 0) * 100
  const notReadyProb = (readiness?.prediction?.probabilities?.["Not Ready"] || 0) * 100

  const statusColor = STATUS_COLORS[readiness?.prediction?.readiness_status as keyof typeof STATUS_COLORS] || STATUS_COLORS["Not Ready"]

  return (
    <div className="h-full overflow-auto bg-background p-8 transition-colors">
      <motion.div
        className="grid grid-cols-12 gap-4 max-w-[1800px] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Section */}
        <Card className="col-span-12 lg:col-span-4 bg-card border-border hover:border-muted transition-all">
          <CardContent className="p-6 space-y-6">
            {profileLoading ? (
              <>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between p-3 rounded-lg border border-border">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
                    <User className="h-8 w-8 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-foreground truncate">{profile?.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{profile?.role}</p>
                    {profile?.designation && (
                      <p className="text-xs text-violet-400 mt-1">{profile.designation}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {profile?.department && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" /> Department
                      </span>
                      <span className="text-sm font-medium text-foreground truncate ml-2">{profile.department}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Status
                    </span>
                    <span className="text-sm font-medium text-emerald-500">Active</span>
                  </div>
                  
                  {profile?.mentorship && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> Mentorship
                      </span>
                      <span className={clsx(
                        "text-sm font-medium capitalize",
                        profile.mentorship.status === "active" ? "text-emerald-500" :
                        profile.mentorship.status === "requested" ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {profile.mentorship.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Readiness Assessment */}
        <Card className="col-span-12 lg:col-span-8 bg-card border-border hover:border-muted transition-all">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" /> Readiness Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {readinessLoading ? (
              <>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
              {/* Readiness Input Details */}
                {readiness && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Performance Rating", value: readiness?.employee_info?.performance_rating, icon: Activity },
                      { label: "Potential Rating", value: readiness?.employee_info?.potential_rating, icon: Target },
                      { label: "Leadership Score", value: readiness?.input_features?.leadership_score, icon: Award },
                      { label: "Technical Score", value: readiness?.input_features?.technical_score, icon: Brain },
                      { label: "Communication Score", value: readiness?.input_features?.communication_score, icon: User },
                      { label: "Experience (Years)", value: readiness?.input_features?.experience_years, icon: Calendar },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-background border border-border hover:border-muted transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            <item.icon className="h-4 w-4 text-violet-400" />
                            {item.label}
                          </span>
                          <span className="text-xs font-medium text-foreground">{item.value ?? "—"}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.value ?? 0) * 10, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mx-2">
                  Here’s a detailed breakdown of your predicted readiness level based on your performance data:
                </p>

                {/* Readiness Summary */}
                <div className={clsx("p-4 rounded-xl border", statusColor.bg, statusColor.border)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx("text-lg font-semibold", statusColor.text)}>
                      {readiness?.prediction?.readiness_status || "Unknown"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {((readiness?.prediction?.confidence ?? 0) * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={clsx("h-full rounded-full", statusColor.fill)}
                      initial={{ width: 0 }}
                      animate={{ width: `${(readiness?.prediction?.confidence ?? 0) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Probability Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-emerald-400 font-medium">Ready</span>
                      <span className="text-xs text-muted-foreground">{readyProb.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${readyProb}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-amber-400 font-medium">Developing</span>
                      <span className="text-xs text-muted-foreground">{developingProb.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${developingProb}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-rose-400 font-medium">Not Ready</span>
                      <span className="text-xs text-muted-foreground">{notReadyProb.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${notReadyProb}%` }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 9-Box Segment */}
        <Card className="col-span-12 bg-card border-border hover:border-muted transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-400" />
              <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-2 text-foreground">
                You are currently in this category:
                <div className="ml-2 text-foreground">
                {segmentLoading ? "Loading…" : segment?.segment_label ?? "Unassigned"}
                </div>
              </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {segmentLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {SEGMENTS.map((row) =>
                    row.map((label) => {
                      const labelKey = label.split(" ")[0] ?? ""
                      const isCurrent = typeof segment?.segment_label === "string" && segment.segment_label.includes(labelKey)
                      return (
                        <motion.div
                          key={label}
                          className={clsx(
                            "p-3 border rounded-lg text-center text-xs font-medium transition-all cursor-default",
                            isCurrent
                              ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-foreground shadow-lg"
                              : "bg-background border-border text-muted-foreground hover:border-muted"
                          )}
                          whileHover={{ scale: isCurrent ? 1 : 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          {label}
                        </motion.div>
                      )
                    })
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Performance →
                  </span>
                  <span className="flex items-center gap-1">
                    Potential ↑
                    <Award className="h-3 w-3" />
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}