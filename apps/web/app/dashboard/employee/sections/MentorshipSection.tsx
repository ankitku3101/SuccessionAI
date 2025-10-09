"use client"
import React from "react"
import { apiGet, apiPost } from "@/lib/api"

export default function MentorshipSection() {
  const [profile, setProfile] = React.useState<any>(null)
  const [candidates, setCandidates] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [mentoring, setMentoring] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Load profile and mentor candidates
  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [pRes, cRes] = await Promise.all([
          apiGet("/api/employee/me"),
          apiGet("/api/employee/mentor-candidates")
        ])
        if (!mounted) return

        if (pRes.ok) setProfile(await pRes.json())
        else setError("Failed to load profile")

        if (cRes.ok) setCandidates(await cRes.json())
        else setError("Failed to load mentor candidates")
      } catch (err) {
        console.error(err)
        setError("Something went wrong")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const requestMentor = async (mentorId: string) => {
    setMentoring(mentorId)
    setError(null)
    try {
      const res = await apiPost("/api/employee/mentorship-request", { mentor_id: mentorId })
      if (!res.ok) {
        const j = await res.json()
        setError(j?.message || "Failed to request mentorship")
      } else {
        // refresh profile and candidates
        const pRes = await apiGet("/api/employee/me")
        if (pRes.ok) setProfile(await pRes.json())

        const cRes = await apiGet("/api/employee/mentor-candidates")
        if (cRes.ok) setCandidates(await cRes.json())
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setMentoring(null)
    }
  }

  if (loading) return <div className="px-4 lg:px-6">Loading mentorship…</div>

  const mentorship = profile?.mentorship

  return (
    <div className="px-4 lg:px-6">
      <h2 className="text-lg font-semibold mb-2">Mentorship</h2>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      <div className="grid gap-2 text-sm mb-4">
        <div>
          <span className="font-medium">Mentorship Status:</span> {mentorship?.status || "none"}
        </div>
        {mentorship?.mentor_id && (
          <div>
            <span className="font-medium">Mentor:</span>{" "}
            {candidates.find(c => c._id === mentorship.mentor_id)?.name || mentorship.mentor_id}
          </div>
        )}
      </div>

      <h3 className="font-medium mb-2">Mentor Candidates</h3>
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
            {candidates.map((c) => (
              <tr key={c._id} className="border-b">
                <td className="py-2 pr-4">{c.name}</td>
                <td className="py-2 pr-4">{c.role || "—"}</td>
                <td className="py-2 pr-4">{c.experience_years ?? "—"}</td>
                <td className="py-2 pr-4">{c.target_success_role || "—"}</td>
                <td className="py-2 pr-4">
                  <button
                    className="border rounded px-2 py-1"
                    disabled={mentoring === c._id || mentorship?.mentor_id === c._id}
                    onClick={() => requestMentor(c._id)}
                  >
                    {mentoring === c._id
                      ? "Requesting..."
                      : mentorship?.mentor_id === c._id
                      ? "Requested"
                      : "Request mentorship"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
