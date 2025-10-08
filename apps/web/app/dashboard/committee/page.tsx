"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getToken, getUser } from "@/lib/auth"
import { apiGet } from "@/lib/api"
import DashboardView from "./sections/DashboardView"
import EmployeesSection from "./sections/EmployeeSection"
import SuccessProfilesSection from "./sections/SuccessProfilesSection"
import CommitteeReports from "./sections/CommitteeReports"

export default function CommitteeDashboard() {
  const router = useRouter()
  const [activeView, setActiveView] = useState("dashboard")

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
      if (activeView === "employees") {
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
      } else if (activeView === "profiles") {
        const res = await apiGet("/api/committee/success-profiles")
        if (res.ok) setSuccessProfiles(await res.json())
      }
      setReady(true)
    }
    load()
  }, [activeView, filters])

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
      <AppSidebar variant="inset" activeView={activeView} setActiveView={setActiveView} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div key={activeView} className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {activeView === "dashboard" && <DashboardView />}
              {activeView === "employees" && (
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
              {activeView === "profiles" && <SuccessProfilesSection profiles={successProfiles} />}
              {activeView === "reports" && <CommitteeReports />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
