"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { User, Lightbulb, RefreshCcw, Target, BookOpen, Users, Trophy, Sparkles } from "lucide-react"
import { apiGet } from "@/lib/api"

export default function EnhancedIDP() {
  const [idpData, setIdpData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [employee, setEmployee] = useState<any | null>(null)
  const [loadingInitial, setLoadingInitial] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const res = await apiGet("/api/employee/me")
        if (res.ok) {
          const data = await res.json()
          setEmployee(data)
          await fetchEnhancedIDP(data)
        }
      } catch (err) {
        console.error("Failed to fetch employee:", err)
      } finally {
        setLoadingInitial(false)
      }
    }
    init()
  }, [])

  const fetchEnhancedIDP = async (emp = employee) => {
    if (!emp) return
    setLoading(true)
    setIdpData(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_AI_URL}/idp/generate/enhanced`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "skip_zrok_interstitial": "1" },
          body: JSON.stringify({ employee_id: emp._id || emp.id || emp.employee_id }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        setIdpData(data.idp)
      } else {
        console.error("Failed to fetch IDP:", res.status)
      }
    } catch (err) {
      console.error("Error fetching IDP:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderLoadingSkeletons = () => (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold">Enhanced Individual Development Plan</h1>
                <p className="text-sm text-muted-foreground mt-0.5">A personalized growth plan tailored for your role and future trajectory.</p>
              </div>
              <Button
                onClick={() => fetchEnhancedIDP()}
                disabled={loading}
                className="shrink-0 gap-2 h-9 px-4"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Generating..." : idpData ? "Regenerate" : "Generate"}
              </Button>
            </div>
          {renderLoadingSkeletons()}
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-semibold mb-2">Unable to load profile</h3>
            <p className="text-sm text-muted-foreground">
              There was an error loading your employee profile.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
                <h1 className="text-2xl font-bold">Enhanced Individual Development Plan</h1>
                <p className="text-sm text-muted-foreground mt-0.5">A personalized growth plan tailored for your role and future trajectory.</p>
            </div>
            <Button
                onClick={() => fetchEnhancedIDP()}
                disabled={loading}
                className="shrink-0 gap-2 h-9 px-4"
            >
                <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Generating..." : idpData ? "Regenerate" : "Generate"}
            </Button>
            </div>
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
            {/* Header */}
            <div className="mb-6">
                

                {/* Employee Info */}
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="rounded-lg border border-border bg-card p-4 hover:border-border/80 transition-colors"
                >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">
                        {employee.name || employee.fullName || "Unknown"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                        {employee.role || "No role"}
                        {employee.department && <span className="text-muted-foreground/70"> · {employee.department}</span>}
                    </p>
                    </div>
                </div>
                </motion.div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {loading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {renderLoadingSkeletons()}
                </motion.div>
                ) : idpData ? (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                >
                    {/* Skills & Resources Grid */}
                    <div className="grid gap-3 md:grid-cols-2">
                    {/* Skills */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.3 }}
                        className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-colors"
                    >
                        <div className="p-4 pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-semibold">Skill Recommendations</h3>
                        </div>
                        </div>
                        <div className="p-4">
                        {idpData.skill_recommendations?.length ? (
                            <div className="space-y-3">
                            {idpData.skill_recommendations.map((skill: any, i: number) => (
                                <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.2 }}
                                >
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{skill.skill}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        {skill.priority}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{skill.timeline}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{skill.reason}</p>
                                </div>
                                </motion.div>
                            ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No recommendations</p>
                        )}
                        </div>
                    </motion.div>

                    {/* Resources */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-colors"
                    >
                        <div className="p-4 pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-semibold">Learning Resources</h3>
                        </div>
                        </div>
                        <div className="p-4">
                        {idpData.learning_resources?.length ? (
                            <div className="space-y-3">
                            {idpData.learning_resources.map((resource: any, i: number) => (
                                <motion.a
                                key={i}
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.2 }}
                                className="block group"
                                >
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                                        {resource.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{resource.provider}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
                                </div>
                                </motion.a>
                            ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No resources</p>
                        )}
                        </div>
                    </motion.div>
                    </div>

                    {/* Mentors & Milestones Grid */}
                    <div className="grid gap-3 md:grid-cols-2">
                    {/* Mentors */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                        className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-colors"
                    >
                        <div className="p-4 pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <h3 className="text-sm font-semibold">Recommended Mentors</h3>
                        </div>
                        </div>
                        <div className="p-4">
                        {idpData.mentors?.length ? (
                            <div className="space-y-3">
                            {idpData.mentors.map((mentor: any, i: number) => (
                                <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.2 }}
                                >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                    <div>
                                        <h4 className="text-sm font-medium">{mentor.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                        {mentor.role} · {mentor.department}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {mentor.matching_skills.map((skill: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                                        >
                                            {skill}
                                        </span>
                                        ))}
                                    </div>
                                    </div>
                                </div>
                                </motion.div>
                            ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No mentors</p>
                        )}
                        </div>
                    </motion.div>

                    {/* Milestones */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-colors"
                    >
                        <div className="p-4 pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-purple-500" />
                            <h3 className="text-sm font-semibold">Milestones</h3>
                        </div>
                        </div>
                        <div className="p-4">
                        {idpData.milestones?.length ? (
                            <div className="space-y-3">
                            {idpData.milestones.map((milestone: any, i: number) => (
                                <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.2 }}
                                >
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">M{milestone.month}</span>
                                    </div>
                                    {i !== idpData.milestones.length - 1 && (
                                        <div className="w-px h-full bg-border mt-1" />
                                    )}
                                    </div>
                                    <div className="flex-1 pb-3">
                                    <p className="text-sm mb-1.5">{milestone.goal}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {milestone.focus.map((item: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                                        >
                                            {item}
                                        </span>
                                        ))}
                                    </div>
                                    </div>
                                </div>
                                </motion.div>
                            ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No milestones</p>
                        )}
                        </div>
                    </motion.div>
                    </div>
                </motion.div>
                ) : (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg border border-dashed border-border bg-muted/30"
                >
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-1.5">No Development Plan Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        Generate your personalized plan with skill recommendations and growth milestones.
                    </p>
                    <Button 
                        onClick={() => fetchEnhancedIDP()} 
                        className="gap-2 h-9 px-4"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Plan
                    </Button>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
            </motion.div>
      </div>
    </div>
  )
}