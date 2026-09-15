import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { AnyProfile, UserRole } from '@/lib/types/db'

/**
 * SERVER-ONLY. Never import this from a client component.
 *
 * Requirement #12: the service-role key stays in the server bundle.
 * NEXT_PUBLIC_* vars are safe to expose; SUPABASE_SERVICE_ROLE_KEY is not.
 */

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. See .env.example.`,
    )
  }

  return value
}

/** Request-scoped client that respects the caller's session + RLS. */
export async function getServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // called from a Server Component — middleware refreshes instead
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            /* as above */
          }
        },
      },
    },
  )
}

/**
 * Admin client — bypasses RLS. Use ONLY where a route legitimately needs
 * to read another user's row (e.g. resolving a farmer's public name).
 * Never hand this to anything that takes unvalidated user input.
 */
export function getAdminSupabase() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401,
  ) {
    super(message)
  }
}

/**
 * Requirement #2, the core of it.
 *
 * Role and company name are read from the `profiles` / `buyer_profiles`
 * tables using the session's user id. Nothing here trusts the request
 * body, a header, or a cookie the client can write.
 */
export async function requireProfile(): Promise<AnyProfile> {
  const supabase = await getServerSupabase()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new AuthError('You must be signed in.', 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, location_id, created_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new AuthError('Complete your profile to continue.', 403)
  }

  const base = {
    id: profile.id as string,
    role: profile.role as UserRole,
    fullName: profile.full_name as string,
    phone: profile.phone as string,
    locationId: profile.location_id as string | null,
    createdAt: profile.created_at as string,
  }

  if (base.role === 'farmer') {
    const { data: farmer } = await supabase
      .from('farmer_profiles')
      .select('farmer_id_url, farmer_id_verified')
      .eq('profile_id', user.id)
      .maybeSingle()

    return {
      ...base,
      role: 'farmer',
      farmerIdUrl: farmer?.farmer_id_url ?? null,
      farmerIdVerified: farmer?.farmer_id_verified ?? false,
    }
  }

  const { data: buyer, error: buyerError } = await supabase
    .from('buyer_profiles')
    .select('company_name, business_type, gstin, business_address')
    .eq('profile_id', user.id)
    .single()

  if (buyerError || !buyer) {
    throw new AuthError('Buyer profile is incomplete.', 403)
  }

  return {
    ...base,
    role: 'buyer',
    companyName: buyer.company_name as string,
    businessType: buyer.business_type as string | null,
    gstin: buyer.gstin as string | null,
    businessAddress: buyer.business_address as string | null,
  }
}

/** Same as requireProfile, but also asserts the role. */
export async function requireRole<R extends UserRole>(
  role: R,
): Promise<Extract<AnyProfile, { role: R }>> {
  const profile = await requireProfile()

  if (profile.role !== role) {
    throw new AuthError(
      `This action is only available to ${role}s.`,
      403,
    )
  }

  return profile as Extract<AnyProfile, { role: R }>
}