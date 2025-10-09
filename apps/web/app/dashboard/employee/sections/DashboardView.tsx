"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User } from "lucide-react"
import clsx from "clsx"
import { apiGet } from "@/lib/api"
import { getUser } from "@/lib/auth"

type Profile = {
  id: number
  name: string
  role: string
  [key: string]: any
}

type DevelopmentPlanItem = {
  progress: number
}

type DevPlan = {
  development_plan: Record<string, DevelopmentPlanItem>
}

type Segment = {
  segment_label: string
}

const SEGMENTS = [
  ["Enigma (High Potential, Low Performance)", "Emerging Talent (High Potential, Medium Performance)", "Star (High Potential, High Performance)"],
  ["Inconsistent Player (Medium Potential, Low Performance)", "Core Contributor (Medium Potential, Medium Performance)", "Consistent Performer (Medium Potential, High Performance)"],
  ["Risk Zone (Low Potential, Low Performance)", "Diligent Worker (Low Potential, Medium Performance)", "Solid Performer (Low Potential, High Performance)"]
]

const SEGMENT_COLORS = {
  default: "bg-muted/20",
  highlight: "bg-blue-400/40"
}

export default function DashboardView({ profile: initialProfile }: { profile?: Profile }) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null)
  const [segment, setSegment] = useState<Segment | null>(null)
  const [devPlan, setDevPlan] = useState<DevPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user) return

    const userId = user.id

    async function fetchDashboardData() {
      setLoading(true)
      try {
        // Profile
        if (!profile) {
          const res = await apiGet("/api/employee/me")
          if (res.ok) {
            const profileData: Profile = await res.json()
            setProfile(profileData)
          }
        }

        // Development Plan
        const planRes = await apiGet("/api/employee/development-plan")
        if (planRes.ok) {
          const planData: DevPlan = await planRes.json()
          setDevPlan(planData)
        }

        // 9-box segment (keep fetch call)
        const segRes = await fetch("http://localhost:8000/segment/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: userId })
        })
        if (segRes.ok) {
          const segData: Segment = await segRes.json()
          setSegment(segData)
        }
      } catch (error) {
        console.error("Dashboard load error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [profile])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="p-6 flex flex-col items-center text-center">
        <div className="mb-4 p-4 rounded-full bg-muted/50 text-muted-foreground">
          <User className="h-20 w-20" />
        </div>
        <h3 className="text-lg font-semibold">{profile?.name || "Employee Name"}</h3>
        <p className="text-sm text-muted-foreground">{profile?.role || "Role"}</p>
      </Card>

      {/* 9-Box Segment */}
      <Card className="p-6 col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>9-Box Segment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {SEGMENTS.map((row) =>
            row.map((label) => {
              const isCurrent = segment?.segment_label === label
              return (
                <div
                  key={label}
                  className={clsx(
                    "p-4 border rounded text-center text-sm",
                    isCurrent ? SEGMENT_COLORS.highlight : SEGMENT_COLORS.default
                  )}
                >
                  {label}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Development Plan */}
      <Card className="p-6 col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Development Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {devPlan?.development_plan ? (
            Object.entries(devPlan.development_plan).map(([key, plan]) => (
              <div key={key}>
                <p className="text-sm font-medium mb-1">{key}</p>
                <div className="w-full bg-muted h-2 rounded overflow-hidden">
                  <div
                    className="h-2 rounded bg-gradient-to-r from-blue-400 to-blue-600"
                    style={{ width: `${plan.progress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.progress?.toFixed(0) || 0}% complete</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No development plan found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
