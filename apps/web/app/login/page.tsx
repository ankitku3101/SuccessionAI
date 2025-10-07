'use client'

import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { ThemeToggleIcon } from "@/components/theme-toggle"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 relative">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Succession AI
        </a>
        <div className="absolute right-0 top-0">
          <ThemeToggleIcon />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
