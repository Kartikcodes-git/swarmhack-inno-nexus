import type { NextRequest } from 'next/server'
import {
  fail,
  handleRoute,
  ok,
  respondToOfferSchema,
} from '@/lib/validation'
import { getServerSupabase, requireProfile } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* PATCH /api/offers/[id] — accept / reject / counter / complete              */
/* -------------------------------------------------------------------------- */
/**
 * Each action is allowed for exactly one side of the deal:
 *   accept / reject / counter  -> the FARMER who owns the listing
 *   complete (grade + final $) -> the BUYER who made the offer
 *
 * Requirement #10: the caller's id must match the relevant column on the
 * offer row. Passing someone else's offer id gets a 403, not an edit.
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await context.params
    const profile = await requireProfile()
    const body = respondToOfferSchema.parse(await request.json())

    const supabase = await getServerSupabase()

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, buyer_id, farmer_id, status, offer_price, counter_price')
      .eq('id', id)
      .single()

    if (offerError || !offer) {
      return fail('Offer not found.', 404)
    }

    const isFarmer = offer.farmer_id === profile.id
    const isBuyer = offer.buyer_id === profile.id

    if (!isFarmer && !isBuyer) {
      return fail('You are not a party to this offer.', 403)
    }

    const patch: Record<string, unknown> = {}

    switch (body.action) {
      case 'accept': {
        if (!isFarmer) {
          return fail('Only the farmer can accept an offer.', 403)
        }
        if (!['pending', 'countered'].includes(offer.status)) {
          return fail('This offer can no longer be accepted.', 409)
        }
        patch.status = 'accepted'
        break
      }

      case 'reject': {
        if (!isFarmer) {
          return fail('Only the farmer can reject an offer.', 403)
        }
        if (!['pending', 'countered'].includes(offer.status)) {
          return fail('This offer can no longer be rejected.', 409)
        }
        patch.status = 'rejected'
        break
      }

      case 'counter': {
        if (!isFarmer) {
          return fail('Only the farmer can counter an offer.', 403)
        }
        if (offer.status !== 'pending') {
          return fail('Only a pending offer can be countered.', 409)
        }
        patch.status = 'countered'
        patch.counter_price = body.counterPrice
        break
      }

      case 'complete': {
        if (!isBuyer) {
          return fail(
            'Only the buyer can grade and complete the purchase.',
            403,
          )
        }
        if (offer.status !== 'accepted') {
          return fail(
            'The farmer must accept the offer before it can be completed.',
            409,
          )
        }
        patch.status = 'completed'
        patch.final_grade = body.finalGrade
        patch.final_price = body.finalPrice
        patch.completed_at = new Date().toISOString()
        break
      }
    }

    const { data, error } = await supabase
      .from('offers')
      .update(patch)
      .eq('id', id)
      .select('id, status, counter_price, final_grade, final_price')
      .single()

    if (error) {
      console.error('[offers:patch]', error)
      return fail('Could not update the offer.', 500)
    }

    return ok(data)
  })
}
