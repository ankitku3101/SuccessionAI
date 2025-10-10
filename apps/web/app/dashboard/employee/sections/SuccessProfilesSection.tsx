"use client"

import React, { useEffect, useState, useRef } from "react"
import { apiGet } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export default function SuccessProfilesSection() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Fetch paginated profiles
  const fetchProfiles = async (pageNum = 1) => {
    try {
      const res = await apiGet(`/api/employee/success-profile?page=${pageNum}`)
      if (!res.ok) {
        setError("Failed to load success profiles")
        return
      }
      const data = await res.json()
      const newProfiles = data.profiles || []

      // Append or initialize
      setProfiles((prev) => (pageNum === 1 ? newProfiles : [...prev, ...newProfiles]))

      // Handle pagination control
      if (newProfiles.length === 0 || newProfiles.length < (data.perPage || 10)) {
        setHasMore(false)
      }
    } catch (err) {
      setError("An error occurred while fetching profiles")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchProfiles(1)
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const container = scrollRef.current
    if (!container || !hasMore || loadingMore) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollTop + clientHeight >= scrollHeight - 60) {
        setLoadingMore(true)
        setPage((prev) => {
          const nextPage = prev + 1
          fetchProfiles(nextPage)
          return nextPage
        })
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [hasMore, loadingMore])

  if (loading)
    return (
      <Card className="p-6 shadow-sm border rounded-lg h-screen">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Success Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded" />
          ))}
        </CardContent>
      </Card>
    )

  if (error)
    return (
      <Card className="p-6 shadow-sm border rounded-lg h-screen">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Success Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
        </CardContent>
      </Card>
    )

  return (
    <Card className="p-6 shadow-sm border rounded-lg h-[88vh] flex flex-col">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">List of all Success Profiles</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto rounded-md border bg-muted/10"
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/30 backdrop-blur-sm z-10">
              <tr className="text-left border-b">
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Description</th>
                <th className="py-3 px-4 font-medium">Required Experience</th>
                <th className="py-3 px-4 font-medium">Required Skills</th>
              </tr>
            </thead>

            <motion.tbody
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {profiles.map((p, idx) => (
                <motion.tr
                  key={idx}
                  className="border-b hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <td className="py-3 px-4">{p.role || "—"}</td>
                  <td className="py-3 px-4">{p.role_description || "—"}</td>
                  <td className="py-3 px-4">
                    {p.required_experience ? `${p.required_experience} yrs` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {(p.required_skills || []).join(", ") || "—"}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>

          {/* Infinite Scroll Loader */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          )}

          {!hasMore && profiles.length > 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              All profiles loaded.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
