"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiGet, apiPatch, apiPost } from "@/lib/api"

export default function EmployeeDetails({
  selected,
  setSelected,
  goals,
  setGoals,
  trainings,
  setTrainings,
}: any) {
  if (!selected) return null

  const handleApproveMentorship = async () => {
    const res = await apiPatch(`/api/committee/employee/${selected._id}`, {
      mentorship: { status: "approved" },
    })
    if (res.ok) {
      const updated = await apiGet(`/api/committee/employee/${selected._id}`)
      if (updated.ok) setSelected(await updated.json())
      alert("Mentorship approved!")
    }
  }

  const handleSaveDevelopmentPlan = async () => {
    const goalsArr = goals
      ? goals
          .split("\n")
          .filter((t: string) => t.trim())
          .map((t: string) => ({ title: t.trim(), status: "pending" }))
      : []
    const trainingsArr = trainings
      ? trainings
          .split("\n")
          .filter((t: string) => t.trim())
          .map((t: string) => ({ name: t.trim(), provider: "", progress: 0 }))
      : []

    const res = await apiPost(`/api/committee/employee/${selected._id}/development-plan`, {
      goals: goalsArr,
      trainings: trainingsArr,
    })

    if (res.ok) {
      const updated = await apiGet(`/api/committee/employee/${selected._id}`)
      if (updated.ok) setSelected(await updated.json())
      setGoals("")
      setTrainings("")
      alert("Development plan saved!")
    }
  }

  return (
    <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>
            View, approve mentorship, or assign a development plan.
          </DialogDescription>
        </DialogHeader>

        {/* Basic Info */}
        <div className="grid gap-2 text-sm border rounded-md p-4 mt-2">
          <div><span className="font-medium">Name:</span> {selected.name}</div>
          <div><span className="font-medium">Email:</span> {selected.email || "—"}</div>
          <div><span className="font-medium">Role:</span> {selected.role || "—"}</div>
          <div><span className="font-medium">Department:</span> {selected.department || "—"}</div>
          <div><span className="font-medium">Target Success Role:</span> {selected.target_success_role || "—"}</div>
          <div><span className="font-medium">Mentorship Status:</span> {selected.mentorship?.status || "—"}</div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleApproveMentorship}>Approve Mentorship</Button>
        </div>

        {/* Development Plan */}
        <div className="mt-6 grid gap-3">
          <label className="text-sm font-medium">Development Goals (one per line)</label>
          <Textarea
            placeholder="Enter development goals..."
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />

          <label className="text-sm font-medium">Trainings (one per line)</label>
          <Textarea
            placeholder="Enter training programs..."
            value={trainings}
            onChange={(e) => setTrainings(e.target.value)}
          />

          <Button onClick={handleSaveDevelopmentPlan} className="w-fit">
            Save Development Plan
          </Button>
        </div>

        {/* Current Plan */}
        {selected.development_plan && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold mb-2">Current Development Plan</h4>
            {selected.development_plan.goals?.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Goals:</p>
                <ul className="list-disc pl-5 text-sm space-y-0.5">
                  {selected.development_plan.goals.map((g: any, i: number) => (
                    <li key={i}>
                      {g.title} — {g.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.development_plan.trainings?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Trainings:</p>
                <ul className="list-disc pl-5 text-sm space-y-0.5">
                  {selected.development_plan.trainings.map((t: any, i: number) => (
                    <li key={i}>
                      {t.name} — {t.progress}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
