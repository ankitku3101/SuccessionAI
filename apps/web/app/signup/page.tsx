"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiPost } from "@/lib/api"
import { saveAuth } from "@/lib/auth"
import { ThemeToggleIcon } from "@/components/theme-toggle"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiPost('/api/auth/signup', { name, email, password, role, department })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Signup failed')
      saveAuth(body.token, body.user)
      router.push('/dashboard/employee')
    } catch (err: any) {
      setError(err?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Employee sign up for Succession AI</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" required value={name} onChange={(e)=>setName(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Current Role</FieldLabel>
                  <Input id="role" value={role} onChange={(e)=>setRole(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="department">Department</FieldLabel>
                  <Input id="department" value={department} onChange={(e)=>setDepartment(e.target.value)} />
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</Button>
                  <FieldDescription className="text-center">Already have an account? <a href="/login">Login</a></FieldDescription>
                  {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="absolute right-0 top-0 p-2">
        <ThemeToggleIcon />
      </div>
    </div>
  )
}


