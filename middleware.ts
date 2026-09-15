import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Requirement #11 — API routes are protected here as a first gate, before a
 * handler runs. Each handler still calls requireProfile()/requireRole(), and
 * RLS still applies at the database. Three layers, deliberately.
 */

const PUBLIC_API = [
  '/api/mandi-prices', // read-only government price data
  '/api/auth',         // sign-in / callback
]

const PUBLIC_READ_ONLY = [
  '/api/listings', // GET is public browsing; writes are checked in the handler
  '/api/ratings',  // GET is public display
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  // refreshes the session cookie so server components see a valid user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!path.startsWith('/api')) {
    return response
  }

  if (PUBLIC_API.some((p) => path.startsWith(p))) {
    return response
  }

  const isPublicRead =
    request.method === 'GET' &&
    PUBLIC_READ_ONLY.some((p) => path.startsWith(p))

  if (isPublicRead) {
    return response
  }

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'You must be signed in.' },
      { status: 401 },
    )
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}