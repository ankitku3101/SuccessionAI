// sections/ProfileSection.tsx
"use client"
import React from "react"
import { apiGet, apiPatch } from "@/lib/api"

export default function ProfileSection() {
  const [profile, setProfile] = React.useState<any>(null)
  const [skillsInput, setSkillsInput] = React.useState("")
  const [targetRole, setTargetRole] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
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
    }
    const res = await apiPatch("/api/employee/me", payload)
    if (res.ok) {
      const j = await res.json()
      setProfile(j)
      setSkillsInput((j?.skills || []).join(", "))
      setTargetRole(j?.target_success_role || "")
    } else {
      // optionally handle error
      console.error("Failed to save profile")
    }
    setSaving(false)
  }

  if (loading) return <div className="px-4 lg:px-6">Loading profile…</div>

  return (
    <div className="px-4 lg:px-6">
      <h2 className="text-lg font-semibold mb-2">Profile</h2>

      <div className="grid gap-2 text-sm mb-4">
        <div><span className="font-medium">Name:</span> {profile?.name}</div>
        <div><span className="font-medium">Role:</span> {profile?.role || "—"}</div>
        <div><span className="font-medium">Department:</span> {profile?.department || "—"}</div>
        <div><span className="font-medium">Target Success Role:</span> {profile?.target_success_role || "—"}</div>
        <div><span className="font-medium">Skills:</span> {(profile?.skills || []).join(", ") || "—"}</div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Skills (comma separated)</label>
        <input
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />

        <label className="block text-sm font-medium">Target Role</label>
        <input
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />

        <div>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded border px-3 py-1"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  )
}
