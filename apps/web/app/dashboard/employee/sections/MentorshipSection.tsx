"use client"

import React, { useEffect, useState, useCallback } from "react"
import { apiGet, apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { User, CheckCircle, Clock, Users } from "lucide-react"
import clsx from "clsx"

export default function MentorshipSection() {
  const [profile, setProfile] = useState<any>(null)
  const [mentorship, setMentorship] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mentoring, setMentoring] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const totalPages = Math.ceil(candidates.length / itemsPerPage)
  const paginatedCandidates = candidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pRes, mRes, cRes] = await Promise.all([
        apiGet("/api/employee/me"),
        apiGet("/api/employee/mentorship-status"),
        apiGet("/api/employee/mentor-candidates"),
      ])

      if (!pRes.ok || !mRes.ok || !cRes.ok) throw new Error("Failed to fetch mentorship data")

      const [profileData, mentorshipData, candidatesData] = await Promise.all([
        pRes.json(),
        mRes.json(),
        cRes.json(),
      ])

      setProfile(profileData)
      setMentorship(mentorshipData.mentorship)
      setCandidates(candidatesData)
    } catch (err: any) {
      setError(err.message || "Something went wrong while fetching mentorship data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const requestMentor = async (mentorId: string) => {
    setMentoring(mentorId)
    try {
      const res = await apiPost("/api/employee/mentorship-request", { mentor_id: mentorId })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to request mentorship")
      await fetchData()
    } catch (err: any) {
      setError(err.message || "Something went wrong while sending mentorship request.")
    } finally {
      setMentoring(null)
    }
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <Skeleton className="h-5 w-1/3 mb-3" />
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 space-y-8">
      <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
        Mentorship Program
      </h2>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {/* Mentorship Details Card */}
      {mentorship ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-zinc-900/60 dark:to-zinc-800/50 backdrop-blur-xl rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-400/5 to-transparent" />

            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  {mentorship.status === "approved"
                    ? "Active Mentorship"
                    : mentorship.status === "requested"
                    ? "Mentorship Request Pending"
                    : "Mentorship Details"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Guidance and learning for your next growth step.
                </p>
              </div>

              {mentorship.status === "approved" ? (
                <CheckCircle className="text-green-500 w-6 h-6" />
              ) : mentorship.status === "requested" ? (
                <Clock className="text-yellow-500 w-6 h-6" />
              ) : (
                <User className="text-blue-500 w-6 h-6" />
              )}
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Mentor Name</p>
                <p className="text-gray-900 dark:text-white">
                  {mentorship?.mentor_id?.name || "N/A"}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Department</p>
                <p className="text-gray-900 dark:text-white">
                  {mentorship?.mentor_id?.department || "—"}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Role</p>
                <p className="text-gray-900 dark:text-white">
                  {mentorship?.mentor_id?.role || "—"}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Status</p>
                <span
                  className={clsx("font-semibold", {
                    "text-green-500": mentorship.status === "approved",
                    "text-yellow-500": mentorship.status === "requested",
                    "text-gray-500": mentorship.status !== "approved" && mentorship.status !== "requested",
                  })}
                >
                  {mentorship.status}
                </span>
              </div>

              {mentorship.status === "approved" && mentorship.approved_at && (
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-600 dark:text-gray-300">Approved At</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(mentorship.approved_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <p className="text-sm text-gray-500">No active mentorship yet.</p>
      )}

      {/* Mentor Candidates */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          Available Mentor Candidates
        </h3>

        {candidates.length === 0 ? (
          <div className="text-sm text-gray-500">No mentor candidates available.</div>
        ) : (
          <div className="overflow-hidden border border-gray-200 dark:border-zinc-700 rounded-xl shadow-md">
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50 dark:bg-zinc-800/50">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Experience (in years)</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidates.map((c) => {
                    const isRequested = mentorship?.mentor_id?._id === c._id
                    const isPending = mentorship?.status === "requested" && isRequested
                    const isApproved = mentorship?.status === "approved" && isRequested

                    return (
                      <motion.tr
                        key={c._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-b last:border-none hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-3">{c.name}</td>
                        <td className="py-3 px-3">{c.role || "—"}</td>
                        <td className="py-3 px-3">{c.experience_years ?? "—"}</td>
                        <td className="py-3 px-3">
                          {isApproved ? (
                            <span className="text-green-600 font-medium">Approved</span>
                          ) : isPending ? (
                            <span className="text-yellow-600 font-medium">Requested</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={mentoring === c._id}
                              onClick={() => requestMentor(c._id)}
                            >
                              {mentoring === c._id ? "Requesting..." : "Request Mentorship"}
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
