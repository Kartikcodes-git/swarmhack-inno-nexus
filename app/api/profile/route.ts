import type { NextRequest } from 'next/server'
import {
  createProfileSchema,
  fail,
  handleRoute,
  ok,
  updateProfileSchema,
} from '@/lib/validation'
import {
  getServerSupabase,
  requireProfile,
} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/profile — the authenticated user's own profile                    */
/* -------------------------------------------------------------------------- */
/**
 * This is what the frontend calls on load to learn who it is talking to.
 * The role in the response is authoritative — it came from the database,
 * keyed on the session. The client cannot influence it.
 */

export async function GET() {
  return handleRoute(async () => ok(await requireProfile()))
}

/* -------------------------------------------------------------------------- */
/* POST /api/profile — complete signup (requirements #1, #3, #4)              */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const supabase = await getServerSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return fail('You must be signed in.', 401)
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existing) {
      return fail('Profile already exists. Use PATCH to update it.', 409)
    }

    const body = createProfileSchema.parse(await request.json())

    // role is written exactly once, here, and is immutable afterwards
    // (enforced by profiles_role_immutable in schema.sql)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      role: body.role,
      full_name: body.fullName,
      phone: body.phone,
      location_id: body.locationId ?? null,
    })

    if (profileError) {
      console.error('[profile:post]', profileError)
      return fail('Could not create the profile.', 500)
    }

    if (body.role === 'farmer') {
      // Digital Farmer ID is now compulsory — schema validation already
      // rejects a missing farmerIdUrl before we get here.
      const { error } = await supabase.from('farmer_profiles').insert({
        profile_id: user.id,
        farmer_id_url: body.farmerIdUrl,
        land_size_acres: body.landSizeAcres ?? null,
      })

      if (error) {
        console.error('[profile:post:farmer]', error)
        return fail('Could not save farmer details.', 500)
      }
    } else {
      const { error } = await supabase.from('buyer_profiles').insert({
        profile_id: user.id,
        company_name: body.companyName,
        business_type: body.businessType ?? null,
        gstin: body.gstin ?? null,
        business_address: body.businessAddress ?? null,
      })

      if (error) {
        console.error('[profile:post:buyer]', error)
        return fail('Could not save business details.', 500)
      }
    }

    return ok(await requireProfile(), 201)
  })
}

/* -------------------------------------------------------------------------- */
/* PATCH /api/profile — update own profile only                               */
/* -------------------------------------------------------------------------- */

export async function PATCH(request: NextRequest) {
  return handleRoute(async () => {
    const profile = await requireProfile()
    const body = updateProfileSchema.parse(await request.json())

    const supabase = await getServerSupabase()

    const core: Record<string, unknown> = {}
    if (body.fullName !== undefined) core.full_name = body.fullName
    if (body.phone !== undefined) core.phone = body.phone
    if (body.locationId !== undefined) core.location_id = body.locationId

    if (Object.keys(core).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(core)
        .eq('id', profile.id)

      if (error) {
        console.error('[profile:patch]', error)
        return fail('Could not update the profile.', 500)
      }
    }

    if (profile.role === 'farmer' && body.farmerIdUrl !== undefined) {
      await supabase
        .from('farmer_profiles')
        .update({ farmer_id_url: body.farmerIdUrl })
        .eq('profile_id', profile.id)
    }

    if (profile.role === 'farmer' && body.landSizeAcres !== undefined) {
      await supabase
        .from('farmer_profiles')
        .update({ land_size_acres: body.landSizeAcres })
        .eq('profile_id', profile.id)
    }

    if (profile.role === 'buyer') {
      const buyerPatch: Record<string, unknown> = {}
      if (body.companyName !== undefined) buyerPatch.company_name = body.companyName
      if (body.businessType !== undefined) buyerPatch.business_type = body.businessType
      if (body.gstin !== undefined) buyerPatch.gstin = body.gstin
      if (body.businessAddress !== undefined) {
        buyerPatch.business_address = body.businessAddress
      }

      if (Object.keys(buyerPatch).length > 0) {
        await supabase
          .from('buyer_profiles')
          .update(buyerPatch)
          .eq('profile_id', profile.id)
      }
    }

    return ok(await requireProfile())
  })
}