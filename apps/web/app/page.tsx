"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_AI_URL}/health`).catch(() => {});
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`).catch(() => {});
    router.replace('/login')
  }, [router])
  return null
}
