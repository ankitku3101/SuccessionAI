"use client"

import React, { useEffect, useState } from "react"
import { apiGet, apiPatch } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Settings } from "lucide-react"
import clsx from "clsx"

export default function ProfileSection() {
  const [profile, setProfile] = useState<any>(null)
  const [skillsInput, setSkillsInput] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [numTrainings, setNumTrainings] = useState<number>(0)
  const [assessmentScores, setAssessmentScores] = useState("")
  const [performanceRating, setPerformanceRating] = useState("")
  const [potentialRating, setPotentialRating] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const res = await apiGet("/api/employee/me")
      if (!mounted) return
      if (res.ok) {
        const j = await res.json()
        setProfile(j)
        setSkillsInput((j?.skills || []).join(", "))
        setTargetRole(j?.target_success_role || "")
        setNumTrainings(j?.num_trainings || 0)
        setAssessmentScores(j?.assessment_scores || "")
        setPerformanceRating(j?.performance_rating || "")
        setPotentialRating(j?.potential_rating || "")
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const onSave = async () => {
    setSaving(true)
    const payload: any = {
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      target_success_role: targetRole,
      num_trainings: numTrainings,
      assessment_scores: assessmentScores,
      performance_rating: performanceRating,
      potential_rating: potentialRating,
    }
    const res = await apiPatch("/api/employee/me", payload)
    if (res.ok) {
      const j = await res.json()
      setProfile(j)
      setSkillsInput((j?.skills || []).join(", "))
      setTargetRole(j?.target_success_role || "")
      setNumTrainings(j?.num_trainings || 0)
      setAssessmentScores(j?.assessment_scores || "")
      setPerformanceRating(j?.performance_rating || "")
      setPotentialRating(j?.potential_rating || "")
    } else {
      console.error("Failed to save profile")
    }
    setSaving(false)
  }

  const getBarColor = (value: number) => {
    if (value >= 8) return "from-emerald-400/80 to-emerald-500/60"
    if (value >= 6) return "from-blue-400/60 to-blue-500/40"
    if (value >= 4) return "from-amber-400/60 to-amber-500/40"
    return "from-rose-400/70 to-rose-500/50"
  }

  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Profile Overview</h2>

      {/* Main Grid: 2/3 details, 1/3 avatar */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Profile Details (2/3) */}
        <div className="md:col-span-2 space-y-3">
          {[
            { label: "Name", value: profile?.name },
            { label: "Role", value: profile?.role || "—" },
            { label: "Department", value: profile?.department || "—" },
            { label: "Target Success Role", value: profile?.target_success_role || "—" },
            { label: "Number of Trainings", value: profile?.num_trainings || 0 },
            { label: "Assessment Scores", value: profile?.assessment_scores || "—" },
            { label: "Performance Rating", value: profile?.performance_rating || "—", type: "bar" },
            { label: "Potential Rating", value: profile?.potential_rating || "—", type: "bar" },
          ].map((item) => (
            <Card
              key={item.label}
              className="p-2 border border-border/40 shadow-sm hover:shadow-lg transition-all"
            >
              <CardContent className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                {item.type === "bar" && item.value !== "—" ? (
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{item.value}</span>
                      <span>{`${Number(item.value) * 10}%`}</span>
                    </div>
                    <div
                      className={clsx(
                        "h-2 w-full rounded-md bg-gradient-to-r",
                        getBarColor(Number(item.value))
                      )}
                      style={{ width: `${Number(item.value) * 10}%` }}
                    />
                  </div>
                ) : item.label === "Skills" ? (
                  <div className="flex flex-wrap gap-1">
                    {(profile?.skills || []).length > 0
                      ? profile.skills.map((s: string) => (
                          <span key={s} className="px-2 py-1 rounded bg-muted text-xs font-medium">
                            {s}
                          </span>
                        ))
                      : "—"}
                  </div>
                ) : (
                  <span className="text-base font-semibold">{item.value}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Avatar / Icon (1/3) */}
        <div className="flex items-center justify-center bg-muted/30 rounded-lg">
          <div className="p-6 rounded-full bg-muted/70 text-muted-foreground shadow-md hover:shadow-lg transition-all">
            <User className="h-40 w-40" />
          </div>
        </div>
      </div>

      {/* Editable Form */}
      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium">Update Profile</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-5 space-y-5 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Skills (comma separated)</label>
              <Input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. Leadership, Communication, React"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Success Role</label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number of Trainings</label>
              <Input
                type="number"
                value={numTrainings}
                onChange={(e) => setNumTrainings(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Assessment Scores</label>
              <Input
                value={assessmentScores}
                onChange={(e) => setAssessmentScores(e.target.value)}
                placeholder="e.g. 80/100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Performance Rating</label>
              <Input
                value={performanceRating}
                onChange={(e) => setPerformanceRating(e.target.value)}
                placeholder="e.g. 4.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Potential Rating</label>
              <Input
                value={potentialRating}
                onChange={(e) => setPotentialRating(e.target.value)}
                placeholder="e.g. 4.0"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
