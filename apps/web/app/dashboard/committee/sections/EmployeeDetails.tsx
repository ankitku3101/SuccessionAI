import { apiGet, apiPatch, apiPost } from "@/lib/api"

export default function EmployeeDetails({ selected, setSelected, goals, setGoals, trainings, setTrainings }: any) {
  const handleApproveMentorship = async () => {
    const res = await apiPatch(`/api/committee/employee/${selected._id}`, { 
      mentorship: { status: "approved" } 
    })
    if (res.ok) {
      const updated = await apiGet(`/api/committee/employee/${selected._id}`)
      if (updated.ok) setSelected(await updated.json())
      alert("Mentorship approved!")
    }
  }

  const handleSaveDevelopmentPlan = async () => {
    const goalsArr = goals
      ? goals.split("\n").filter((t: string) => t.trim()).map((t: string) => ({ title: t.trim(), status: "pending" }))
      : []
    const trainingsArr = trainings
      ? trainings.split("\n").filter((t: string) => t.trim()).map((t: string) => ({ name: t.trim(), provider: "", progress: 0 }))
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
    <div className="mt-6 border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Employee Details</h3>
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setSelected(null)}
        >
          ✕
        </button>
      </div>
      
      <div className="grid gap-2 text-sm mb-4">
        <div>
          <span className="font-medium">Name:</span> {selected.name}
        </div>
        <div>
          <span className="font-medium">Email:</span> {selected.email || "—"}
        </div>
        <div>
          <span className="font-medium">Role:</span> {selected.role || "—"}
        </div>
        <div>
          <span className="font-medium">Department:</span> {selected.department || "—"}
        </div>
        <div>
          <span className="font-medium">Target Success Role:</span> {selected.target_success_role || "—"}
        </div>
        <div>
          <span className="font-medium">Mentorship Status:</span> {selected.mentorship?.status || "—"}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button 
          onClick={handleApproveMentorship}
          className="bg-primary text-primary-foreground rounded px-3 py-2 w-fit"
        >
          Approve Mentorship
        </button>

        <div className="sm:col-span-2 grid gap-2">
          <label className="text-sm font-medium">Development Goals (one per line)</label>
          <textarea 
            className="border rounded p-2 min-h-24" 
            value={goals} 
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Enter development goals..."
          />
          
          <label className="text-sm font-medium">Trainings (one per line)</label>
          <textarea
            className="border rounded p-2 min-h-24"
            value={trainings}
            onChange={(e) => setTrainings(e.target.value)}
            placeholder="Enter training programs..."
          />
          
          <button 
            onClick={handleSaveDevelopmentPlan}
            className="bg-primary text-primary-foreground rounded px-3 py-2 w-fit"
          >
            Save Development Plan
          </button>
        </div>
      </div>

      {selected.development_plan && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2">Current Development Plan</h4>
          {selected.development_plan.goals?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Goals:</p>
              <ul className="list-disc pl-5 text-sm">
                {selected.development_plan.goals.map((g: any, i: number) => (
                  <li key={i}>{g.title} - {g.status}</li>
                ))}
              </ul>
            </div>
          )}
          {selected.development_plan.trainings?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Trainings:</p>
              <ul className="list-disc pl-5 text-sm">
                {selected.development_plan.trainings.map((t: any, i: number) => (
                  <li key={i}>{t.name} - {t.progress}%</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}