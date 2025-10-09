"use client"
import React from "react"
import { apiGet } from "@/lib/api"

export default function SuccessProfilesSection() {
  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const res = await apiGet("/api/employee/success-profile")
      if (!mounted) return

      if (res.ok) {
        const data = await res.json()
        setProfiles(data.profiles || [])
      } else {
        setError("Failed to load success profiles")
      }

      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading success profiles…</div>
  if (error) return <div>{error}</div>

  return (
    <div className="px-4 lg:px-6">
      <h2 className="text-lg font-semibold mb-2">Success Profiles</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Required Experience</th>
              <th className="py-2 pr-4">Required Skills</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2 pr-4">{p.role || "—"}</td>
                <td className="py-2 pr-4">{p.role_description || "—"}</td>
                <td className="py-2 pr-4">{p.required_experience ?? "—"} yrs</td>
                <td className="py-2 pr-4">{(p.required_skills || []).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
