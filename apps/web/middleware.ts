import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value
  const role = req.cookies.get('role')?.value as 'employee' | 'committee' | undefined

  // Public routes
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  if (!token && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (token && pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = role === 'committee' ? '/dashboard/committee' : '/dashboard/employee'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|fonts|public).*)'],
}


