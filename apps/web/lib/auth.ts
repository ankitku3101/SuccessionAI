export type AuthUser = {
  id: string
  name: string
  email: string
  user_role: 'employee' | 'committee'
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('token', token)
  window.localStorage.setItem('user', JSON.stringify(user))
  // Mirror in cookies for middleware
  document.cookie = `token=${token}; path=/; SameSite=Lax`
  document.cookie = `role=${user.user_role}; path=/; SameSite=Lax`
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('token')
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('user')
  return raw ? JSON.parse(raw) as AuthUser : null
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
  document.cookie = 'token=; Max-Age=0; path=/'
  document.cookie = 'role=; Max-Age=0; path=/'
}


