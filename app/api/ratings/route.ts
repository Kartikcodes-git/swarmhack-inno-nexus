import type { NextRequest } from 'next/server'
import {
  createRatingSchema,
  fail,
  handleRoute,
  ok,
} from '@/lib/validation'
import { getServerSupabase, requireRole } from '@/lib/supabase/server'
import type { Rating } from '@/lib/types/db'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/ratings?farmerId=... — public, for display                        */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const farmerId = request.nextUrl.searchParams.get('farmerId')

    if (!farmerId) {
      return fail('farmerId is required.', 422)
    }

    const supabase = await getServerSupabase()

    const [{ data: rows, error }, { data: summary }] = await Promise.all([
      supabase
        .from('ratings')
        .select('id, offer_id, farmer_id, buyer_id, stars, comment, created_at')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('farmer_rating_summary')
        .select('average_stars, rating_count')
        .eq('farmer_id', farmerId)
        .maybeSingle(),
    ])

    if (error) {
      console.error('[ratings:get]', error)
      return fail('Could not load ratings.', 500)
    }

    const ratings: Rating[] = (rows ?? []).map((row: any) => ({
      id: row.id,
      offerId: row.offer_id,
      farmerId: row.farmer_id,
      buyerId: row.buyer_id,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.created_at,
    }))

    return ok({
      ratings,
      summary: {
        farmerId,
        average: Number(summary?.average_stars ?? 0),
        count: Number(summary?.rating_count ?? 0),
      },
    })
  })
}

/* -------------------------------------------------------------------------- */
/* POST /api/ratings — requirements #9 and #10                                */
/* -------------------------------------------------------------------------- */
/**
 * The client sends only an offerId. Everything that decides whether the
 * rating is legitimate is derived here:
 *
 *   1. caller must be a buyer (role from DB)
 *   2. the offer must exist and belong to this buyer
 *   3. the offer must be 'completed' — i.e. a real finished purchase
 *   4. farmerId comes off the offer row, not the request
 *   5. `ratings.offer_id` is UNIQUE, so one purchase = at most one rating
 *
 * The same rules are re-checked by the `ratings_must_be_earned` trigger in
 * schema.sql, so bypassing this route does not bypass the rule.
 */

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const buyer = await requireRole('buyer')

    const body = createRatingSchema.parse(await request.json())

    const supabase = await getServerSupabase()

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, buyer_id, farmer_id, status')
      .eq('id', body.offerId)
      .single()

    if (offerError || !offer) {
      return fail('That purchase does not exist.', 404)
    }

    if (offer.buyer_id !== buyer.id) {
      return fail('You can only rate your own purchases.', 403)
    }

    if (offer.status !== 'completed') {
      return fail(
        'You can rate a farmer only after the purchase is completed.',
        403,
      )
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert({
        offer_id: offer.id,
        farmer_id: offer.farmer_id,
        buyer_id: buyer.id,
        stars: body.stars,
        comment: body.comment ?? null,
      })
      .select('id, offer_id, farmer_id, buyer_id, stars, comment, created_at')
      .single()

    if (error) {
      // unique_violation on offer_id
      if (error.code === '23505') {
        return fail('You have already rated this purchase.', 409)
      }

      console.error('[ratings:post]', error)
      return fail('Could not submit the rating.', 500)
    }

    return ok(data, 201)
  })
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/ratings?id=... — a buyer may remove only their own rating      */
/* -------------------------------------------------------------------------- */

export async function DELETE(request: NextRequest) {
  return handleRoute(async () => {
    const buyer = await requireRole('buyer')
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return fail('id is required.', 422)
    }

    const supabase = await getServerSupabase()

    const { error, count } = await supabase
      .from('ratings')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('buyer_id', buyer.id)

    if (error) {
      console.error('[ratings:delete]', error)
      return fail('Could not delete the rating.', 500)
    }

    if (!count) {
      return fail('Rating not found, or not yours to delete.', 404)
    }

    return ok({ deleted: true })
  })
}
