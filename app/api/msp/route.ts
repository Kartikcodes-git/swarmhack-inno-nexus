import type { NextRequest } from 'next/server'
import { fail, handleRoute, ok } from '@/lib/validation'
import { getServerSupabase } from '@/lib/supabase/server'
import type { CropMsp } from '@/lib/types/db'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/msp?crop=Onion — public. Powers the MSP badge on listings.        */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const crop = request.nextUrl.searchParams.get('crop')

    const supabase = await getServerSupabase()

    let query = supabase
      .from('crop_msp')
      .select('id, crop_name, season, msp_per_quintal, effective_from')
      .order('crop_name', { ascending: true })

    if (crop) {
      query = query.eq('crop_name', crop)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('[msp:get]', error)
      return fail('Could not load MSP data.', 500)
    }

    const records: CropMsp[] = (rows ?? []).map((row: any) => ({
      id: row.id,
      cropName: row.crop_name,
      season: row.season,
      mspPerQuintal: Number(row.msp_per_quintal),
      effectiveFrom: row.effective_from,
    }))

    return ok(records)
  })
}
