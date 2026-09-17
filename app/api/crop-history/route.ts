import {
  createCropHistorySchema,
  fail,
  handleRoute,
  ok,
} from '@/lib/validation'
import { getServerSupabase, requireRole } from '@/lib/supabase/server'
import type { FarmerCropHistoryEntry } from '@/lib/types/db'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/crop-history — the signed-in farmer's own crop history.           */
/* Feeds the recommendation engine (#3, #4, #5) and, together with            */
/* farmer_profiles.land_size_acres and profiles.location_id, completes the    */
/* farmer data-gathering requirement (#2).                                    */
/* -------------------------------------------------------------------------- */

export async function GET() {
  return handleRoute(async () => {
    const farmer = await requireRole('farmer')

    const supabase = await getServerSupabase()

    const { data: rows, error } = await supabase
      .from('farmer_crop_history')
      .select('id, farmer_id, crop_name, season, quantity_quintals, created_at')
      .eq('farmer_id', farmer.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[crop-history:get]', error)
      return fail('Could not load crop history.', 500)
    }

    const history: FarmerCropHistoryEntry[] = (rows ?? []).map((row: any) => ({
      id: row.id,
      farmerId: row.farmer_id,
      cropName: row.crop_name,
      season: row.season,
      quantityQuintals:
        row.quantity_quintals === null ? null : Number(row.quantity_quintals),
      createdAt: row.created_at,
    }))

    return ok(history)
  })
}

/* -------------------------------------------------------------------------- */
/* POST /api/crop-history — farmer logs a crop they grew (land size + season).*/
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  return handleRoute(async () => {
    const farmer = await requireRole('farmer')

    const body = createCropHistorySchema.parse(await request.json())

    const supabase = await getServerSupabase()

    const { data, error } = await supabase
      .from('farmer_crop_history')
      .insert({
        farmer_id: farmer.id,
        crop_name: body.cropName,
        season: body.season,
        quantity_quintals: body.quantityQuintals ?? null,
      })
      .select('id, farmer_id, crop_name, season, quantity_quintals, created_at')
      .single()

    if (error) {
      console.error('[crop-history:post]', error)
      return fail('Could not save crop history.', 500)
    }

    const entry: FarmerCropHistoryEntry = {
      id: data.id,
      farmerId: data.farmer_id,
      cropName: data.crop_name,
      season: data.season,
      quantityQuintals:
        data.quantity_quintals === null ? null : Number(data.quantity_quintals),
      createdAt: data.created_at,
    }

    return ok(entry, 201)
  })
}
