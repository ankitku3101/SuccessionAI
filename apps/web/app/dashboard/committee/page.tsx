"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getToken, getUser } from "@/lib/auth"
import DashboardView from "./sections/DashboardView"
import EmployeesSection from "./sections/EmployeeSection"
import SuccessProfilesSection from "./sections/SuccessProfilesSection"
import CommitteeReports from "./sections/CommitteeReports"
import { apiGet } from "@/lib/api"
import NineBoxMatrix from "./sections/NineBoxMatrix"

export default function CommitteeDashboard() {
  const router = useRouter()
  const [activeView, setActiveView] = useState("dashboard")

  const [ready, setReady] = useState(false)
  const [filters, setFilters] = useState({ q: "", department: "", role: "" })
  const [departments, setDepartments] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [goals, setGoals] = useState("")
  const [trainings, setTrainings] = useState("")

  // Access control
  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (!token) return router.replace("/login")
    if (user?.user_role !== "committee") return router.replace("/dashboard/employee")
    setReady(true)
  }, [router])

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
                  filters={filters}
                  setFilters={setFilters}
                  departments={departments}
                  roles={roles}
                  setDepartments={setDepartments}
                  setRoles={setRoles}
                  selected={selected}
                  setSelected={setSelected}
                  goals={goals}
                  trainings={trainings}
                  setGoals={setGoals}
                  setTrainings={setTrainings}
                />
              )}
              {activeView === "profiles" && <SuccessProfilesSection />}
              {activeView === "reports" && <CommitteeReports />}
              {activeView === "nine_box_matrix" && <NineBoxMatrix />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
