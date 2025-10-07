"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
// Removed placeholder SectionCards
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getToken, getUser } from "@/lib/auth"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import { ProfileEditSheet } from "./profile-edit"

export default function EmployeeDashboard() {
  const router = useRouter()
  const [ready, setReady] = React.useState(false)
  const [profile, setProfile] = React.useState<any>(null)
  const mentorship = profile?.mentorship
  const [skillsInput, setSkillsInput] = React.useState("")
  const [targetRole, setTargetRole] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [candidates, setCandidates] = React.useState<any[]>([])
  const [mentoring, setMentoring] = React.useState<string | null>(null)

  React.useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (!token) return router.replace('/login')
    if (user?.user_role !== 'employee') return router.replace('/dashboard/committee')
    async function load() {
      const res = await apiGet('/api/employee/me')
      if (res.ok) {
        const j = await res.json()
        setProfile(j)
        setSkillsInput((j?.skills || []).join(", "))
        setTargetRole(j?.target_success_role || "")
      }
      const mc = await apiGet('/api/employee/mentor-candidates')
      if (mc.ok) {
        const list = await mc.json()
        setCandidates(list)
      }
      setReady(true)
    }
    load()
  }, [router])

  if (!ready) return null

  return (
    <SidebarProvider style={{"--sidebar-width":"calc(var(--spacing) * 72)","--header-height":"calc(var(--spacing) * 12)"} as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="grid gap-2 text-sm">
                  <div><span className="font-medium">Name:</span> {profile?.name}</div>
                  <div><span className="font-medium">Role:</span> {profile?.role || '—'}</div>
                  <div><span className="font-medium">Department:</span> {profile?.department || '—'}</div>
                  <div><span className="font-medium">Target Success Role:</span> {profile?.target_success_role || '—'}</div>
                  <div><span className="font-medium">Skills:</span> {(profile?.skills || []).join(', ') || '—'}</div>
                  <div><span className="font-medium">Mentorship Status:</span> {mentorship?.status || 'none'}</div>
                  {mentorship?.mentor_id && (
                    <div><span className="font-medium">Mentor:</span> {mentorship.mentor_id}</div>
                  )}
                </div>
              </div>
              <div className="px-4 lg:px-6 flex items-center gap-2">
                <ProfileEditSheet
                  skillsInput={skillsInput}
                  setSkillsInput={setSkillsInput}
                  targetRole={targetRole}
                  setTargetRole={setTargetRole}
                  saving={saving}
                  onSave={async () => {
                    setSaving(true)
                    const payload: any = {
                      skills: skillsInput.split(',').map((s)=>s.trim()).filter(Boolean),
                      target_success_role: targetRole,
                    }
                    const res = await apiPatch('/api/employee/me', payload)
                    if (res.ok) {
                      const j = await res.json()
                      setProfile(j)
                    }
                    setSaving(false)
                  }}
                />
              </div>
              <div className="px-4 lg:px-6">
                <h2 className="font-semibold mb-2">Mentor Candidates</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Experience</th>
                        <th className="py-2 pr-4">Target Role</th>
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c)=> (
                        <tr key={c._id} className="border-b">
                          <td className="py-2 pr-4">{c.name}</td>
                          <td className="py-2 pr-4">{c.role || '—'}</td>
                          <td className="py-2 pr-4">{c.experience_years ?? '—'}</td>
                          <td className="py-2 pr-4">{c.target_success_role || '—'}</td>
                          <td className="py-2 pr-4">
                            <button
                              className="border rounded px-2 py-1"
                              disabled={mentoring === c._id}
                              onClick={async ()=>{
                                setMentoring(c._id)
                                await apiPost('/api/employee/mentorship-request', { mentor_id: c._id })
                                setMentoring(null)
                              }}
                            >{mentoring === c._id ? 'Requesting...' : 'Request mentorship'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


