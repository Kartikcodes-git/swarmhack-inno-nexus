import type { NextRequest } from 'next/server'
import {
  fail,
  handleRoute,
  ok,
  updateListingSchema,
} from '@/lib/validation'
import { getServerSupabase, requireRole } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Requirement #10 — unauthorized editing/deletion.
 *
 * Ownership is checked twice on purpose:
 *   - `.eq('farmer_id', farmer.id)` on the query, so a mismatched id
 *     updates zero rows rather than someone else's row
 *   - the RLS policies in schema.sql, which hold even if this code is wrong
 */

async function assertOwned(id: string, farmerId: string) {
  const supabase = await getServerSupabase()

  const { data } = await supabase
    .from('listings')
    .select('id, farmer_id')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { error: fail('Listing not found.', 404) }

  if (data.farmer_id !== farmerId) {
    // deliberately 404, not 403 — don't confirm that someone else's
    // listing id exists
    return { error: fail('Listing not found.', 404) }
  }

  return { error: null }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params
    const farmer = await requireRole('farmer')

    const guard = await assertOwned(id, farmer.id)
    if (guard.error) return guard.error

    const body = updateListingSchema.parse(await request.json())

    const patch: Record<string, unknown> = {}
    if (body.cropName !== undefined) patch.crop_name = body.cropName
    if (body.cropCategory !== undefined) patch.crop_category = body.cropCategory
    if (body.quantityQuintals !== undefined) {
      patch.quantity_quintals = body.quantityQuintals
    }
    if (body.pricePerQuintal !== undefined) {
      patch.price_per_quintal = body.pricePerQuintal
    }
    if (body.locationId !== undefined) patch.location_id = body.locationId
    if (body.grade !== undefined) patch.grade = body.grade
    if (body.status !== undefined) patch.status = body.status

    if (Object.keys(patch).length === 0) {
      return fail('Nothing to update.', 422)
    }

    const supabase = await getServerSupabase()

    const { data, error } = await supabase
      .from('listings')
      .update(patch)
      .eq('id', id)
      .eq('farmer_id', farmer.id)
      .select('id')
      .single()

    if (error) {
      console.error('[listings:patch]', error)
      return fail('Could not update the listing.', 500)
    }

    return ok({ id: data.id })
  })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params
    const farmer = await requireRole('farmer')

    const supabase = await getServerSupabase()

    // withdraw rather than hard-delete: offers reference this listing, and
    // completed offers are the evidence ratings depend on.
    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'withdrawn' })
      .eq('id', id)
      .eq('farmer_id', farmer.id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[listings:delete]', error)
      return fail('Could not withdraw the listing.', 500)
    }

    if (!data) {
      return fail('Listing not found.', 404)
    }

    return ok({ deleted: true })
  })
}
