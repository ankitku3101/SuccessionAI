"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth"

export default function Page() {
  const router = useRouter()
  useEffect(() => {
    const user = getUser()
    if (!user) return router.replace('/login')
    router.replace(user.user_role === 'committee' ? '/dashboard/committee' : '/dashboard/employee')
  }, [router])
  return null
}
