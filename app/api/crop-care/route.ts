import type { NextRequest } from 'next/server'
import { fail, handleRoute, ok } from '@/lib/validation'
import { getServerSupabase } from '@/lib/supabase/server'
import type { CropCareGuideline } from '@/lib/types/db'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/crop-care?crop=Onion — public. Rotation/disease (#4) and          */
/* irrigation/pesticide (#5) guidance, one row per crop.                      */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const crop = request.nextUrl.searchParams.get('crop')

    const supabase = await getServerSupabase()

    let query = supabase
      .from('crop_care_guidelines')
      .select(
        'crop_name, recommended_rotation_crops, disease_risk_notes, irrigation_advice, pesticide_advice',
      )

    if (crop) {
      query = query.eq('crop_name', crop)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('[crop-care:get]', error)
      return fail('Could not load crop care guidelines.', 500)
    }

    const guidelines: CropCareGuideline[] = (rows ?? []).map((row: any) => ({
      cropName: row.crop_name,
      recommendedRotationCrops: row.recommended_rotation_crops ?? [],
      diseaseRiskNotes: row.disease_risk_notes,
      irrigationAdvice: row.irrigation_advice,
      pesticideAdvice: row.pesticide_advice,
    }))

    return ok(guidelines)
  })
}
