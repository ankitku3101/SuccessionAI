"use client"

import React, { useEffect, useState } from "react"
import { apiGet, apiPatch } from "@/lib/api" 
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import clsx from "clsx"

type EditableScores = {
  technical: number | string;
  communication: number | string;
  leadership: number | string;
};

export default function ProfileSection() {
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [skillsInput, setSkillsInput] = useState("")
  const [numTrainings, setNumTrainings] = useState<number | string>("")
  const [performanceRating, setPerformanceRating] = useState<number | string>("")
  const [potentialRating, setPotentialRating] = useState<number | string>("")
  const [assessmentScores, setAssessmentScores] = useState<EditableScores>({
    technical: '',
    communication: '',
    leadership: '',
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const res = await apiGet("/api/employee/me")
      if (!mounted) return
      if (res.ok) {
        const j = await res.json()
        setProfile(j)

        setSkillsInput("")
        setNumTrainings(j?.num_trainings ?? "")
        setPerformanceRating(j?.performance_rating ?? "")
        setPotentialRating(j?.potential_rating ?? "")
        setAssessmentScores({
          technical: j?.assessment_scores?.technical ?? '',
          communication: j?.assessment_scores?.communication ?? '',
          leadership: j?.assessment_scores?.leadership ?? '',
        })
      }
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAssessmentScores(prev => ({ ...prev, [name]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    
    const payload: any = {};

    const newSkillsInput = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const currentSkills = profile?.skills || [];
    
    const mergedSkills = [...new Set([...currentSkills, ...newSkillsInput])];
    
    if (mergedSkills.length > currentSkills.length) {
      payload.skills = mergedSkills;
    }

    const currentNumTrainings = profile?.num_trainings ?? null;
    const newNumTrainings = numTrainings === "" ? null : Number(numTrainings);
    
    if (newNumTrainings !== currentNumTrainings) {
      payload.num_trainings = newNumTrainings;
    }
    
    const currentPerfRating = profile?.performance_rating ?? null;
    const newPerfRating = performanceRating === "" ? null : Number(performanceRating);
    
    if (newPerfRating !== currentPerfRating) {
      payload.performance_rating = newPerfRating;
    }

    const currentPotRating = profile?.potential_rating ?? null;
    const newPotRating = potentialRating === "" ? null : Number(potentialRating);
    
    if (newPotRating !== currentPotRating) {
      payload.potential_rating = newPotRating;
    }

    const newScores: any = {};
    let hasAnyScore = false;
    
    if (assessmentScores.technical !== '') {
      newScores.technical = Number(assessmentScores.technical);
      hasAnyScore = true;
    }
    if (assessmentScores.communication !== '') {
      newScores.communication = Number(assessmentScores.communication);
      hasAnyScore = true;
    }
    if (assessmentScores.leadership !== '') {
      newScores.leadership = Number(assessmentScores.leadership);
      hasAnyScore = true;
    }

    const originalScores = profile?.assessment_scores || {};
    let scoresChanged = false;
    
    if (assessmentScores.technical !== '' && Number(assessmentScores.technical) !== originalScores.technical) {
      scoresChanged = true;
    }
    if (assessmentScores.communication !== '' && Number(assessmentScores.communication) !== originalScores.communication) {
      scoresChanged = true;
    }
    if (assessmentScores.leadership !== '' && Number(assessmentScores.leadership) !== originalScores.leadership) {
      scoresChanged = true;
    }
    
    if (!scoresChanged) {
      if (originalScores.technical && assessmentScores.technical === '') scoresChanged = true;
      if (originalScores.communication && assessmentScores.communication === '') scoresChanged = true;
      if (originalScores.leadership && assessmentScores.leadership === '') scoresChanged = true;
    }
    
    if (scoresChanged && hasAnyScore) {
      payload.assessment_scores = newScores;
    }

    if (Object.keys(payload).length === 0) {
      alert("No changes detected. Please modify at least one field before saving.");
      setSaving(false);
      return;
    }

    const res = await apiPatch("/api/employee/me", payload);

    if (res.ok) {
      const j = await res.json();
      setProfile(j);
      setSkillsInput("");
      setNumTrainings(j?.num_trainings ?? "");
      setPerformanceRating(j?.performance_rating ?? "");
      setPotentialRating(j?.potential_rating ?? "");
      setAssessmentScores({
        technical: j?.assessment_scores?.technical ?? '',
        communication: j?.assessment_scores?.communication ?? '',
        leadership: j?.assessment_scores?.leadership ?? '',
      });
      setDialogOpen(false); 
    } else {
      const errorData = await res.json();
      console.error("Failed to save profile:", errorData.message);
      alert(`Error: ${errorData.message || 'An unknown error occurred.'}`);
    }
    setSaving(false);
  };

  const getBarColor = (value: number) => {
    if (value >= 8) return "from-emerald-400/80 to-emerald-500/60"
    if (value >= 6) return "from-blue-400/60 to-blue-500/40"
    if (value >= 4) return "from-amber-400/60 to-amber-500/40"
    return "from-rose-400/70 to-rose-500/50"
  }

  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Profile Overview</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Update Profile</DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="p-4 space-y-5 text-sm">
                <div className="grid md:grid-cols-2 gap-x-4 gap-y-5">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Add Skills (comma separated)</label>
                        <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g. TypeScript, Docker"/>
                        <p className="text-xs text-muted-foreground mt-1">New skills will be added to your existing skills</p>
                    </div>
                    
                    <div className="md:col-span-2 border-t pt-4">
                        <label className="block text-sm font-medium mb-2">Assessment Scores</label>
                        <div className="grid grid-cols-3 gap-3">
                            <Input name="technical" type="number" value={assessmentScores.technical} onChange={handleScoreChange} placeholder="Technical"/>
                            <Input name="communication" type="number" value={assessmentScores.communication} onChange={handleScoreChange} placeholder="Communication"/>
                            <Input name="leadership" type="number" value={assessmentScores.leadership} onChange={handleScoreChange} placeholder="Leadership"/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Number of Trainings</label>
                        <Input type="number" value={numTrainings} onChange={(e) => setNumTrainings(e.target.value)} placeholder="e.g. 5"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">Performance Rating</label>
                        <Input type="number" step="0.1" value={performanceRating} onChange={(e) => setPerformanceRating(e.target.value)} placeholder="e.g. 4.2"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">Potential Rating</label>
                        <Input type="number" step="0.1" value={potentialRating} onChange={(e) => setPotentialRating(e.target.value)} placeholder="e.g. 4.0"/>
                    </div>
                </div>
                <div className="pt-2">
                    <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {[
            { label: "Name", value: profile?.name },
            { label: "Role", value: profile?.role || "—" },
            { label: "Department", value: profile?.department || "—" },
            { label: "Education", value: profile?.education || "—" },
            { label: "Age", value: profile?.age ?? "—" },
            { label: "Experience (Years)", value: profile?.experience_years ?? "—" },
            { label: "Skills", value: profile?.skills ?? [], type: "skills" },
            { label: "Number of Trainings", value: profile?.num_trainings ?? 0 },
            { label: "Assessment Scores", value: profile?.assessment_scores ?? "—", type: "assessment" },
            { label: "Performance Rating", value: profile?.performance_rating ?? "—", type: "bar" },
            { label: "Potential Rating", value: profile?.potential_rating ?? "—", type: "bar" },
          ].map((item) => (
            <Card key={item.label} className="p-3 border border-border/40 shadow-sm hover:shadow-lg transition-all">
              <CardContent className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>

                {item.type === "skills" ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(item.value) && item.value.length > 0 ? (
                      item.value.map((s: string) => (
                        <span key={s} className="px-2 py-1 rounded-md bg-muted text-xs font-medium">{s}</span>
                      ))
                    ) : (
                      <span className="text-base font-semibold">—</span>
                    )}
                  </div>
                ) : item.type === "assessment" ? (
                  typeof item.value === "object" && item.value !== null ? (
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Technical</div>
                        <div className="font-semibold">{item.value.technical ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Communication</div>
                        <div className="font-semibold">{item.value.communication ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Leadership</div>
                        <div className="font-semibold">{item.value.leadership ?? "—"}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-base font-semibold">{String(item.value)}</span>
                  )
                ) : item.type === "bar" && item.value !== "—" && item.value > 0 ? (
                  <div className="w-full max-w-xs ml-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{item.value} / 5</span>
                      <span className="text-muted-foreground">{`${(Number(item.value) / 5 * 100).toFixed(0)}%`}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={clsx("h-2 rounded-full bg-gradient-to-r", getBarColor(Number(item.value) * 2))} // Multiply by 2 to map 1-5 scale to 1-10 color scale
                          style={{ width: `${(Number(item.value) / 5) * 100}%` }}
                        />
                    </div>
                  </div>
                ) : (
                  <span className="text-base font-semibold">{item.value ?? '—'}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <motion.div
          className="relative hidden md:flex items-center justify-center overflow-hidden rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-slate-950 rounded-full blur-3xl"
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          />
          <motion.div
            className="relative z-10 p-6 rounded-full bg-background/80 backdrop-blur-md shadow-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <User className="h-24 w-24 lg:h-32 lg:w-32 text-primary" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}