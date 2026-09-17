import { fail, handleRoute, ok } from '@/lib/validation'
import { getServerSupabase, requireRole } from '@/lib/supabase/server'
import { buildFarmerRecommendations } from '@/lib/recommendations'
import type {
  CropCareGuideline,
  CropMsp,
  FarmerCropHistoryEntry,
} from '@/lib/types/db'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/recommendations — bucket A #3.                                    */
/* "Push recommendations to farmers according to their crops": reads the      */
/* signed-in farmer's crop history, joins it against crop_msp (#1) and        */
/* crop_care_guidelines (#4 rotation, #5 irrigation/pesticide), and returns   */
/* a single ranked feed. No new tables — this route is pure composition.      */
/* -------------------------------------------------------------------------- */

export async function GET() {
  return handleRoute(async () => {
    const farmer = await requireRole('farmer')

    const supabase = await getServerSupabase()

    const { data: historyRows, error: historyError } = await supabase
      .from('farmer_crop_history')
      .select('id, farmer_id, crop_name, season, quantity_quintals, created_at')
      .eq('farmer_id', farmer.id)

    if (historyError) {
      console.error('[recommendations:history]', historyError)
      return fail('Could not load your crop history.', 500)
    }

    const history: FarmerCropHistoryEntry[] = (historyRows ?? []).map(
      (row: any) => ({
        id: row.id,
        farmerId: row.farmer_id,
        cropName: row.crop_name,
        season: row.season,
        quantityQuintals:
          row.quantity_quintals === null ? null : Number(row.quantity_quintals),
        createdAt: row.created_at,
      }),
    )

    if (history.length === 0) {
      // Nothing grown yet — nothing to recommend against. Not an error.
      return ok([])
    }

    const cropNames = [...new Set(history.map((h) => h.cropName))]

    const [{ data: mspRows, error: mspError }, { data: careRows, error: careError }] =
      await Promise.all([
        supabase
          .from('crop_msp')
          .select('id, crop_name, season, msp_per_quintal, effective_from')
          .in('crop_name', cropNames),
        supabase
          .from('crop_care_guidelines')
          .select(
            'crop_name, recommended_rotation_crops, disease_risk_notes, irrigation_advice, pesticide_advice',
          )
          .in('crop_name', cropNames),
      ])

    if (mspError || careError) {
      console.error('[recommendations:joins]', mspError, careError)
      return fail('Could not build recommendations.', 500)
    }

    const msps: CropMsp[] = (mspRows ?? []).map((row: any) => ({
      id: row.id,
      cropName: row.crop_name,
      season: row.season,
      mspPerQuintal: Number(row.msp_per_quintal),
      effectiveFrom: row.effective_from,
    }))

    const guidelines: CropCareGuideline[] = (careRows ?? []).map((row: any) => ({
      cropName: row.crop_name,
      recommendedRotationCrops: row.recommended_rotation_crops ?? [],
      diseaseRiskNotes: row.disease_risk_notes,
      irrigationAdvice: row.irrigation_advice,
      pesticideAdvice: row.pesticide_advice,
    }))

    const recommendations = buildFarmerRecommendations(history, msps, guidelines)

    return ok(recommendations)
  })
}
