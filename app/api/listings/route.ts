import type { NextRequest } from 'next/server'
import {
  createListingSchema,
  listingFiltersSchema,
  fail,
  handleRoute,
  ok,
} from '@/lib/validation'
import { getServerSupabase, requireRole } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types/db'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/listings — browse with filters (requirement #8)                   */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const params = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    )

    const filters = listingFiltersSchema.parse(params)

    if (
      filters.minPrice != null &&
      filters.maxPrice != null &&
      filters.minPrice > filters.maxPrice
    ) {
      return fail('Minimum price cannot exceed maximum price.', 422)
    }

    const supabase = await getServerSupabase()

    let query = supabase
      .from('listings')
      .select(
        `
        id, crop_name, crop_category, quantity_quintals,
        price_per_quintal, location_id, grade, status, created_at,
        farmer_id,
        profiles!listings_farmer_id_fkey ( full_name ),
        farmer_rating_summary ( average_stars, rating_count )
      `,
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters.crop) query = query.eq('crop_name', filters.crop)
    if (filters.category) query = query.eq('crop_category', filters.category)
    if (filters.locationId) query = query.eq('location_id', filters.locationId)
    if (filters.grade) query = query.eq('grade', filters.grade)
    if (filters.minPrice != null) {
      query = query.gte('price_per_quintal', filters.minPrice)
    }
    if (filters.maxPrice != null) {
      query = query.lte('price_per_quintal', filters.maxPrice)
    }

    const { data, error } = await query

    if (error) {
      console.error('[listings:get]', error)
      return fail('Could not load listings.', 500)
    }

    const listings: Listing[] = (data ?? []).map((row: any) => ({
      id: row.id,
      farmerId: row.farmer_id,
      farmerName: row.profiles?.full_name ?? 'Farmer',
      cropName: row.crop_name,
      cropCategory: row.crop_category,
      quantityQuintals: Number(row.quantity_quintals),
      pricePerQuintal: Number(row.price_per_quintal),
      locationId: row.location_id,
      grade: row.grade,
      status: row.status,
      createdAt: row.created_at,
      farmerRating: {
        average: Number(row.farmer_rating_summary?.average_stars ?? 0),
        count: Number(row.farmer_rating_summary?.rating_count ?? 0),
      },
    }))

    return ok(listings)
  })
}

/* -------------------------------------------------------------------------- */
/* POST /api/listings — farmers only (requirement #7)                          */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    // throws 403 for buyers; role read from the DB, not the request
    const farmer = await requireRole('farmer')

    const body = createListingSchema.parse(await request.json())

    const supabase = await getServerSupabase()

    const { data, error } = await supabase
      .from('listings')
      .insert({
        farmer_id: farmer.id,
        crop_name: body.cropName,
        crop_category: body.cropCategory,
        quantity_quintals: body.quantityQuintals,
        price_per_quintal: body.pricePerQuintal,
        location_id: body.locationId,
        grade: body.grade,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[listings:post]', error)
      return fail('Could not create the listing.', 500)
    }

    return ok({ id: data.id }, 201)
  })
}
