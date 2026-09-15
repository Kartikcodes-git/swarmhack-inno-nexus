import type { NextRequest } from 'next/server'
import {
  createOfferSchema,
  fail,
  handleRoute,
  ok,
} from '@/lib/validation'
import {
  getServerSupabase,
  requireProfile,
  requireRole,
} from '@/lib/supabase/server'
import type { Offer } from '@/lib/types/db'

export const dynamic = 'force-dynamic'

const mapOffer = (row: any): Offer => ({
  id: row.id,
  listingId: row.listing_id,
  buyerId: row.buyer_id,
  farmerId: row.farmer_id,
  buyerCompany: row.buyer_company,
  quantityQuintals: Number(row.quantity_quintals),
  offerPrice: Number(row.offer_price),
  counterPrice: row.counter_price == null ? null : Number(row.counter_price),
  message: row.message,
  status: row.status,
  finalGrade: row.final_grade,
  finalPrice: row.final_price == null ? null : Number(row.final_price),
  completedAt: row.completed_at,
  createdAt: row.created_at,
})

/* -------------------------------------------------------------------------- */
/* GET /api/offers — the caller's own offers, whichever side they're on       */
/* -------------------------------------------------------------------------- */

export async function GET() {
  return handleRoute(async () => {
    const profile = await requireProfile()
    const supabase = await getServerSupabase()

    const column = profile.role === 'buyer' ? 'buyer_id' : 'farmer_id'

    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq(column, profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[offers:get]', error)
      return fail('Could not load offers.', 500)
    }

    return ok((data ?? []).map(mapOffer))
  })
}

/* -------------------------------------------------------------------------- */
/* POST /api/offers — buyers only                                             */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const buyer = await requireRole('buyer')

    const body = createOfferSchema.parse(await request.json())

    const supabase = await getServerSupabase()

    // Resolve the listing server-side. The client sends only an id — it
    // does not get to tell us the farmer, the price ceiling, or the seller.
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, farmer_id, quantity_quintals, status')
      .eq('id', body.listingId)
      .single()

    if (listingError || !listing) {
      return fail('That listing no longer exists.', 404)
    }

    if (listing.status !== 'active') {
      return fail('That listing is no longer accepting offers.', 409)
    }

    if (listing.farmer_id === buyer.id) {
      return fail('You cannot make an offer on your own listing.', 403)
    }

    if (body.quantityQuintals > Number(listing.quantity_quintals)) {
      return fail(
        `Offer quantity cannot exceed ${listing.quantity_quintals} quintals.`,
        422,
        { quantityQuintals: 'More than the farmer has listed.' },
      )
    }

    const { data, error } = await supabase
      .from('offers')
      .insert({
        listing_id: listing.id,
        buyer_id: buyer.id,
        farmer_id: listing.farmer_id,
        // Requirement #5 — from the authenticated profile, not the payload.
        buyer_company: buyer.companyName,
        quantity_quintals: body.quantityQuintals,
        offer_price: body.offerPrice,
        message: body.message ?? null,
      })
      .select('*')
      .single()

    if (error) {
      // the exclusion constraint in schema.sql
      if (error.code === '23P01') {
        return fail(
          'You already have an open offer on this listing.',
          409,
        )
      }

      console.error('[offers:post]', error)
      return fail('Could not submit the offer.', 500)
    }

    return ok(mapOffer(data), 201)
  })
}
