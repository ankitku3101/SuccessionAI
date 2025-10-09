"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getToken, getUser } from "@/lib/auth"
import { apiGet } from "@/lib/api"
import ProfileSection from "./sections/ProfileSection"
import MentorshipSection from "./sections/MentorshipSection"
import SuccessProfilesSection from "./sections/SuccessProfilesSection"
import EmployeeGapAnalysis from "./sections/EmployeeGapAnalysis"
import DashboardView from "./sections/DashboardView"

export default function EmployeeDashboard() {
  const router = useRouter()
  const [ready, setReady] = React.useState(false)

  // which view is active
  const [activeView, setActiveView] = React.useState<
    "profile" | "mentorship" | "dashboard" | "successProfiles" | "employeeGapAnalysis"
  >("dashboard")

  // wrapper so AppSidebar can call with a string and we safely update the typed state
  const handleSetActiveView = React.useCallback((view: string) => {
    if (
      view === "profile" ||
      view === "mentorship" ||
      view === "dashboard" ||
      view === "successProfiles" ||
      view === "employeeGapAnalysis"
    ) {
      setActiveView(view)
    } else {
      console.warn("AppSidebar attempted to set unknown view:", view)
    }
  }, [])

  const [profile, setProfile] = React.useState<any>(null)

  // access control
  React.useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (!token) return router.replace("/login")
    if (user?.user_role !== "employee")
      return router.replace("/dashboard/committee")
    setReady(true)
  }, [router])

  // load a small profile summary (used by Overview/dashboard)
  React.useEffect(() => {
    let mounted = true
    async function loadProfile() {
      const res = await apiGet("/api/employee/me")
      if (!mounted) return
      if (res.ok) {
        const j = await res.json()
        setProfile(j)
      }
    }

    if (activeView === "dashboard") {
      loadProfile()
    }

    if (!profile) {
      loadProfile()
    }

    return () => {
      mounted = false
    }
  }, [activeView])

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
      <AppSidebar
        variant="inset"
        activeView={activeView}
        setActiveView={handleSetActiveView}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div
              key={activeView}
              className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6"
            >
              {activeView === "dashboard" && <DashboardView />}
              {activeView === "profile" && <ProfileSection />}
              {activeView === "mentorship" && <MentorshipSection />}
              {activeView === "successProfiles" && <SuccessProfilesSection />}
              {activeView === "employeeGapAnalysis" && <EmployeeGapAnalysis />}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
