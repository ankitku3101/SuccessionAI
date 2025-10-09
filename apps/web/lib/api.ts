const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token');
}

export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export function apiHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function apiGet(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), { ...init, method: 'GET', headers: apiHeaders(init?.headers as HeadersInit) }).then(handleAuth);
}

export function apiPost(path: string, body?: any, init?: RequestInit) {
  return fetch(apiUrl(path), { ...init, method: 'POST', headers: apiHeaders(init?.headers as HeadersInit), body: body ? JSON.stringify(body) : undefined }).then(handleAuth);
}

export function apiPatch(path: string, body?: any, init?: RequestInit) {
  return fetch(apiUrl(path), { ...init, method: 'PATCH', headers: apiHeaders(init?.headers as HeadersInit), body: body ? JSON.stringify(body) : undefined }).then(handleAuth);
}

function handleAuth(res: Response): Response {
  if (res.status === 401 && typeof window !== 'undefined') {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
    document.cookie = 'token=; Max-Age=0; path=/'
    document.cookie = 'role=; Max-Age=0; path=/'
    const current = window.location.pathname
    if (!current.startsWith('/login')) {
      const url = new URL('/login', window.location.origin)
      url.searchParams.set('redirect', current)
      window.location.replace(url.toString())
    }
  }
  return res
}


