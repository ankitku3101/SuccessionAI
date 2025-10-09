"use client"

import React from "react"
import { apiGet } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

export default function SuccessProfilesSection() {
  const [profiles, setProfiles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [perPage] = React.useState(5)

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
    return () => {
      mounted = false
    }
  }, [])

  if (loading)
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Success Profiles</CardTitle>
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
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Success Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
        </CardContent>
      </Card>
    )

  // Pagination logic
  const totalPages = Math.ceil(profiles.length / perPage)
  const startIdx = (page - 1) * perPage
  const visibleProfiles = profiles.slice(startIdx, startIdx + perPage)

  return (
    <Card className="p-6 shadow-sm border rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Success Profiles</CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-[600px] rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-muted/30">
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Description</th>
                <th className="py-3 px-4 font-medium">Required Experience</th>
                <th className="py-3 px-4 font-medium">Required Skills</th>
              </tr>
            </thead>

            <AnimatePresence>
              <motion.tbody
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {visibleProfiles.map((p, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">{p.role || "—"}</td>
                    <td className="py-3 px-4">{p.role_description || "—"}</td>
                    <td className="py-3 px-4">{p.required_experience ?? "—"} yrs</td>
                    <td className="py-3 px-4">
                      {(p.required_skills || []).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </ScrollArea>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-5">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
