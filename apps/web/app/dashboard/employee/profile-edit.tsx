"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function ProfileEditSheet({
  skillsInput,
  setSkillsInput,
  targetRole,
  setTargetRole,
  onSave,
  saving,
}: {
  skillsInput: string
  setSkillsInput: (v: string) => void
  targetRole: string
  setTargetRole: (v: string) => void
  onSave: () => Promise<void>
  saving: boolean
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">Edit Profile</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid gap-3">
          <label className="text-sm">Skills (comma separated)</label>
          <input className="border rounded px-2 py-1" value={skillsInput} onChange={(e)=>setSkillsInput(e.target.value)} />
          <label className="text-sm">Target Success Role</label>
          <input className="border rounded px-2 py-1" value={targetRole} onChange={(e)=>setTargetRole(e.target.value)} />
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}


