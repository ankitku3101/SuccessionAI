"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getToken, getUser } from "@/lib/auth"
import { apiGet, apiPatch, apiPost } from "@/lib/api"

export default function CommitteeDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view") || "employees"

  const [ready, setReady] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [filters, setFilters] = useState({ q: "", department: "", role: "" })
  const [departments, setDepartments] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [goals, setGoals] = useState("")
  const [trainings, setTrainings] = useState("")
  const [successProfiles, setSuccessProfiles] = useState<any[]>([])

  // Access control
  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (!token) return router.replace("/login")
    if (user?.user_role !== "committee") return router.replace("/dashboard/employee")
  }, [router])

  // Load data depending on the current view
  useEffect(() => {
    async function load() {
      if (view === "employees") {
        const query = new URLSearchParams({ limit: "10", page: "1", ...filters }).toString()
        const res = await apiGet(`/api/committee/employees?${query}`)
        if (res.ok) {
          const j = await res.json()
          setEmployees(j.items || [])
          const deps = Array.from(
            new Set((j.items || []).map((x: any) => x.department).filter(Boolean))
          ) as string[]

          const rls = Array.from(
            new Set((j.items || []).map((x: any) => x.role).filter(Boolean))
          ) as string[]
          setDepartments(deps)
          setRoles(rls)
        }
      } else if (view === "profiles") {
        const res = await apiGet("/api/committee/success-profiles")
        if (res.ok) setSuccessProfiles(await res.json())
      }
      setReady(true)
    }
    load()
  }, [view, filters])

  if (!ready) return null

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div key={view} className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {view === "employees" && (
                <EmployeesSection
                  employees={employees}
                  filters={filters}
                  setFilters={setFilters}
                  departments={departments}
                  roles={roles}
                  selected={selected}
                  setSelected={setSelected}
                  goals={goals}
                  trainings={trainings}
                  setGoals={setGoals}
                  setTrainings={setTrainings}
                />
              )}
              {view === "profiles" && <SuccessProfilesSection profiles={successProfiles} />}
              {view === "reports" && <CommitteeReports />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function EmployeesSection({
  employees,
  filters,
  setFilters,
  departments,
  roles,
  selected,
  setSelected,
  goals,
  trainings,
  setGoals,
  setTrainings,
}: any) {
  return (
    <>
      <h2 className="font-semibold text-lg mb-2">Employees</h2>
      <div className="grid gap-2 mb-3 sm:grid-cols-3">
        <input
          className="border rounded px-2 py-1"
          placeholder="Search"
          value={filters.q}
          onChange={(e) => setFilters((s: any) => ({ ...s, q: e.target.value }))}
        />
        <select
          className="border rounded px-2 py-1"
          value={filters.department}
          onChange={(e) => setFilters((s: any) => ({ ...s, department: e.target.value }))}
        >
          <option value="">All Departments</option>
          {departments.map((d: string) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={filters.role}
          onChange={(e) => setFilters((s: any) => ({ ...s, role: e.target.value }))}
        >
          <option value="">All Roles</option>
          {roles.map((r: string) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-muted/50">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Department</th>
              <th className="py-2 pr-4">Target Success Role</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e: any) => (
              <tr key={e._id} className="border-b">
                <td className="py-2 pr-4">{e.name}</td>
                <td className="py-2 pr-4">{e.email || "—"}</td>
                <td className="py-2 pr-4">{e.role || "—"}</td>
                <td className="py-2 pr-4">{e.department || "—"}</td>
                <td className="py-2 pr-4">{e.target_success_role || "—"}</td>
                <td className="py-2 pr-4">
                  <button
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const res = await apiGet(`/api/committee/employee/${e._id}`)
                      if (res.ok) setSelected(await res.json())
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <EmployeeDetails
          selected={selected}
          setSelected={setSelected}
          goals={goals}
          trainings={trainings}
          setGoals={setGoals}
          setTrainings={setTrainings}
        />
      )}
    </>
  )
}

function EmployeeDetails({ selected, setSelected, goals, setGoals, trainings, setTrainings }: any) {
  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Employee Details</h3>
      <div className="grid gap-2 text-sm mb-3">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Approve Mentorship */}
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const res = await apiPatch(`/api/committee/employee/${selected._id}`, { mentorship: { status: "approved" } })
            if (res.ok) setSelected(await res.json())
          }}
        >
          <button className="bg-primary text-primary-foreground rounded px-3 py-2 w-fit">
            Approve Mentorship
          </button>
        </form>

        {/* Development Plan */}
        <form
          className="grid gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            const goalsArr = goals
              ? goals.split("\n").map((t: string) => ({ title: t.trim(), status: "pending" }))
              : []
            const trainingsArr = trainings
              ? trainings.split("\n").map((t: string) => ({ name: t.trim(), provider: "", progress: 0 }))
              : []
            const res = await apiPost(`/api/committee/employee/${selected._id}/development-plan`, {
              goals: goalsArr,
              trainings: trainingsArr,
            })
            if (res.ok) {
              const updated = await apiGet(`/api/committee/employee/${selected._id}`)
              if (updated.ok) setSelected(await updated.json())
            }
          }}
        >
          <label className="text-sm">Development Goals (one per line)</label>
          <textarea className="border rounded p-2 min-h-24" value={goals} onChange={(e) => setGoals(e.target.value)} />
          <label className="text-sm">Trainings (one per line)</label>
          <textarea
            className="border rounded p-2 min-h-24"
            value={trainings}
            onChange={(e) => setTrainings(e.target.value)}
          />
          <button className="bg-primary text-primary-foreground rounded px-3 py-2 w-fit">
            Save Development Plan
          </button>
        </form>
      </div>
    </div>
  )
}

function SuccessProfilesSection({ profiles }: any) {
  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Success Profiles</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((p: any) => (
          <div key={p._id} className="border rounded p-3">
            <h3 className="font-semibold">{p.role}</h3>
            <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
            <ul className="list-disc pl-5 text-sm">
              {p.key_competencies?.map((c: string) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommitteeReports() {
  const [summary, setSummary] = useState<any | null>(null)
  useEffect(() => {
    async function load() {
      const res = await apiGet("/api/committee/reports/summary")
      if (res.ok) setSummary(await res.json())
    }
    load()
  }, [])
  if (!summary) return null
  return (
    <div>
      <h2 className="font-semibold text-lg mb-2">Reports Summary</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-medium mb-1">By Department</h3>
          <ul className="list-disc pl-5 text-sm">
            {summary.byDepartment?.map((d: any) => (
              <li key={d._id}>
                {d._id || "—"}: {d.count} employees, Avg Perf {Math.round((d.avgPerf || 0) * 10) / 10}, Avg Pot{" "}
                {Math.round((d.avgPot || 0) * 10) / 10}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-1">Readiness By Role</h3>
          <ul className="list-disc pl-5 text-sm">
            {summary.readinessByRole?.map((r: any) => (
              <li key={r._id}>
                {r._id || "—"}: {r.count} employees, Avg Perf {Math.round((r.avgPerf || 0) * 10) / 10}, Avg Pot{" "}
                {Math.round((r.avgPot || 0) * 10) / 10}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
