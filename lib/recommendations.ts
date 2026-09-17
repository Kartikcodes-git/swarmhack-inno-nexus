import type {
  CropCareGuideline,
  CropMsp,
  CropRecommendation,
  FarmerCropHistoryEntry,
} from '@/lib/types/db'

/**
 * Bucket A recommendation engine.
 *
 * Pure function: DB rows in, ranked recommendations out. Routes/components
 * stay dumb — they fetch the three inputs and call this.
 *
 *   #3 push recommendations to farmers according to their crops
 *   #4 crop rotation recommendations due to disease
 *   #5 irrigation / pesticide recommendations
 */

const KIND_WEIGHT: Record<CropRecommendation['kind'], number> = {
  msp: 30,
  rotation: 20,
  pesticide: 15,
  irrigation: 10,
}

/** Most recent crop grown per crop name (a farmer may have grown one crop several seasons). */
function latestEntryPerCrop(
  history: FarmerCropHistoryEntry[],
): FarmerCropHistoryEntry[] {
  const latest = new Map<string, FarmerCropHistoryEntry>()

  for (const entry of history) {
    const existing = latest.get(entry.cropName)

    if (!existing || entry.createdAt > existing.createdAt) {
      latest.set(entry.cropName, entry)
    }
  }

  return [...latest.values()]
}

function bestMspFor(
  cropName: string,
  season: string,
  msps: CropMsp[],
): CropMsp | undefined {
  return (
    msps.find((m) => m.cropName === cropName && m.season === season) ??
    msps.find((m) => m.cropName === cropName)
  )
}

function guidelineFor(
  cropName: string,
  guidelines: CropCareGuideline[],
): CropCareGuideline | undefined {
  return guidelines.find((g) => g.cropName === cropName)
}

export function buildFarmerRecommendations(
  history: FarmerCropHistoryEntry[],
  msps: CropMsp[],
  guidelines: CropCareGuideline[],
): CropRecommendation[] {
  const crops = latestEntryPerCrop(history)
  const out: CropRecommendation[] = []

  for (const entry of crops) {
    const msp = bestMspFor(entry.cropName, entry.season, msps)
    const guideline = guidelineFor(entry.cropName, guidelines)

    // #3 — MSP-based selling recommendation
    if (msp) {
      out.push({
        cropName: entry.cropName,
        kind: 'msp',
        message: `Government MSP for ${entry.cropName} (${msp.season}) is ₹${msp.mspPerQuintal.toLocaleString('en-IN')}/quintal. List at or above this to avoid distress selling.`,
        priority: KIND_WEIGHT.msp,
      })
    }

    // #4 — crop rotation, driven by disease risk
    if (guideline?.recommendedRotationCrops.length) {
      const next = guideline.recommendedRotationCrops.join(', ')
      const reason = guideline.diseaseRiskNotes
        ? ` (${guideline.diseaseRiskNotes})`
        : ''

      out.push({
        cropName: entry.cropName,
        kind: 'rotation',
        message: `You grew ${entry.cropName} last in ${entry.season}. Rotate to ${next} next season to break disease build-up${reason}.`,
        priority: KIND_WEIGHT.rotation,
      })
    }

    // #5 — irrigation
    if (guideline?.irrigationAdvice) {
      out.push({
        cropName: entry.cropName,
        kind: 'irrigation',
        message: guideline.irrigationAdvice,
        priority: KIND_WEIGHT.irrigation,
      })
    }

    // #5 — pesticide
    if (guideline?.pesticideAdvice) {
      out.push({
        cropName: entry.cropName,
        kind: 'pesticide',
        message: guideline.pesticideAdvice,
        priority: KIND_WEIGHT.pesticide,
      })
    }
  }

  return out.sort((a, b) => b.priority - a.priority)
}

/** #1 — compare a listing's price against MSP. Drives the "Above/Below MSP" badge (strings already in lib/language.tsx). */
export type MspComparison = {
  status: 'above' | 'below' | 'unavailable'
  msp: CropMsp | null
  differencePerQuintal: number | null
}

export function compareToMsp(
  cropName: string,
  season: string,
  pricePerQuintal: number,
  msps: CropMsp[],
): MspComparison {
  const msp = bestMspFor(cropName, season, msps)

  if (!msp) {
    return { status: 'unavailable', msp: null, differencePerQuintal: null }
  }

  const difference = pricePerQuintal - msp.mspPerQuintal

  return {
    status: difference >= 0 ? 'above' : 'below',
    msp,
    differencePerQuintal: difference,
  }
}
