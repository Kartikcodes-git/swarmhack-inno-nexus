export type SpoilageProfile = {
  dailyLossPercent: number
  shelfLifeDays: number
}

/**
 * Approximate daily spoilage rate + typical shelf life per crop.
 * Perishables (tomato, potato, onion) lose value fast;
 * grains/cotton barely spoil in the short term.
 */
const SPOILAGE_PROFILES: Record<string, SpoilageProfile> = {
  Onion: { dailyLossPercent: 0.5, shelfLifeDays: 60 },
  Tomato: { dailyLossPercent: 4, shelfLifeDays: 7 },
  Wheat: { dailyLossPercent: 0.05, shelfLifeDays: 365 },
  Soybean: { dailyLossPercent: 0.1, shelfLifeDays: 180 },
  Cotton: { dailyLossPercent: 0.02, shelfLifeDays: 365 },
  Potato: { dailyLossPercent: 1.5, shelfLifeDays: 30 },
  Maize: { dailyLossPercent: 0.2, shelfLifeDays: 120 },
  Gram: { dailyLossPercent: 0.1, shelfLifeDays: 180 },

  // Fruits — highly perishable, short shelf life
  Banana: { dailyLossPercent: 5, shelfLifeDays: 6 },
  Grapes: { dailyLossPercent: 3.5, shelfLifeDays: 12 },
  Mango: { dailyLossPercent: 4.5, shelfLifeDays: 8 },
  Pomegranate: { dailyLossPercent: 1.2, shelfLifeDays: 45 },
  Orange: { dailyLossPercent: 1.8, shelfLifeDays: 25 },
}

const DEFAULT_PROFILE: SpoilageProfile = {
  dailyLossPercent: 0.3,
  shelfLifeDays: 90,
}

export function getSpoilageProfile(cropName: string): SpoilageProfile {
  return SPOILAGE_PROFILES[cropName] ?? DEFAULT_PROFILE
}

/**
 * Compounding spoilage over N days.
 * e.g. 4%/day for 3 days ≠ 12% flat — it's 1 - (0.96)^3 ≈ 11.5%.
 */
export function getSpoilagePercent(
  cropName: string,
  days: number,
): number {
  if (days <= 0) {
    return 0
  }

  const { dailyLossPercent } = getSpoilageProfile(cropName)
  const retainedFraction = Math.pow(
    1 - dailyLossPercent / 100,
    days,
  )

  return Math.min(
    100,
    Math.round((1 - retainedFraction) * 1000) / 10,
  )
}

export type DailySpoilageForecast = {
  day: number
  projectedPricePerQuintal: number
  spoilagePercent: number
  remainingQuantity: number
  effectiveRevenue: number
}

/**
 * Day-by-day projection combining:
 * - price drift (dailyPriceChangePercent, derived from forecast.ts trend)
 * - spoilage-driven quantity loss (compounding, from this crop's profile)
 *
 * effectiveRevenue = projected price × quantity still sellable that day.
 * Lets a farmer see whether waiting for a better price is worth the
 * spoilage loss, not just the price change alone.
 */
export function getMultidayForecast(
  cropName: string,
  currentPricePerQuintal: number,
  quantityInQuintals: number,
  dailyPriceChangePercent: number,
  days: number = 7,
): DailySpoilageForecast[] {
  const forecast: DailySpoilageForecast[] = []

  for (let day = 1; day <= days; day++) {
    const projectedPricePerQuintal = Math.round(
      currentPricePerQuintal *
        Math.pow(1 + dailyPriceChangePercent / 100, day),
    )

    const spoilagePercent = getSpoilagePercent(cropName, day)

    const remainingQuantity =
      quantityInQuintals * (1 - spoilagePercent / 100)

    const effectiveRevenue = Math.round(
      projectedPricePerQuintal * remainingQuantity,
    )

    forecast.push({
      day,
      projectedPricePerQuintal,
      spoilagePercent,
      remainingQuantity:
        Math.round(remainingQuantity * 100) / 100,
      effectiveRevenue,
    })
  }

  return forecast
}

/**
 * Picks the day with the highest effective (spoilage-adjusted)
 * revenue out of a multiday forecast — the "best day to sell".
 */
export function getBestSellDay(
  forecast: DailySpoilageForecast[],
): DailySpoilageForecast | null {
  if (forecast.length === 0) {
    return null
  }

  return forecast.reduce((best, point) =>
    point.effectiveRevenue > best.effectiveRevenue
      ? point
      : best,
  )
}