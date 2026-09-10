export type ForecastDecision =
  | 'WAIT'
  | 'SELL NOW'
  | 'COMPARE MARKETS'

export type ForecastResult = {
  currentPrice: number
  range: [number, number]
  midpoint: number
  trend: 'Increasing' | 'Stable' | 'Decreasing'
  confidence: number
  decision: ForecastDecision
  reason: string
}

/**
 * Simple linear regression slope over an evenly-spaced series.
 * Real (if basic) trend math instead of a hardcoded lookup table.
 */
function computeTrendSlope(values: readonly number[]): number {
  const n = values.length

  if (n < 2) {
    return 0
  }

  const xMean = (n - 1) / 2
  const yMean =
    values.reduce((sum, value) => sum + value, 0) / n

  let numerator = 0
  let denominator = 0

  values.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean)
    denominator += (x - xMean) ** 2
  })

  return denominator === 0 ? 0 : numerator / denominator
}

export function getForecast(
  cropName: string,
): ForecastResult {
  const series =
    historicalSeries[
      cropName as keyof typeof historicalSeries
    ] ?? historicalSeries.Onion

  const recent = series['30 Days']
  const currentPrice = recent.at(-1) ?? 0

  // Slope is "price change per sample". Project roughly
  // 2 samples ahead (~7 days, since 30-day series has 8
  // samples spaced ~4 days apart).
  const slope = computeTrendSlope(recent)
  const projectedChange = Math.round(slope * 2)
  const midpoint = currentPrice + projectedChange

  const changePercent =
    currentPrice === 0
      ? 0
      : (projectedChange / currentPrice) * 100

  const spread = Math.max(
    Math.round(Math.abs(projectedChange)) + 40,
    40,
  )

  const range: [number, number] = [
    midpoint - spread,
    midpoint + spread,
  ]

  const trend: ForecastResult['trend'] =
    changePercent > 0.5
      ? 'Increasing'
      : changePercent < -0.5
        ? 'Decreasing'
        : 'Stable'

  const volatility =
    Math.max(...recent) - Math.min(...recent)

  const confidence = Math.max(
    50,
    Math.min(
      90,
      Math.round(
        85 - (volatility / (currentPrice || 1)) * 200,
      ),
    ),
  )

  const decision: ForecastDecision =
    changePercent >= 2
      ? 'WAIT'
      : changePercent <= -2
        ? 'SELL NOW'
        : 'COMPARE MARKETS'

  const reason =
    decision === 'WAIT'
      ? `Based on the last 30 days of price movement, the forecast midpoint is ${changePercent.toFixed(
          1,
        )}% above the current market price, suggesting that waiting may offer a better selling price.`
      : decision === 'SELL NOW'
        ? `Based on the last 30 days of price movement, the forecast midpoint is ${Math.abs(
            changePercent,
          ).toFixed(
            1,
          )}% below the current market price, suggesting that selling now may reduce the risk of further price decline.`
        : `The forecasted price change is only ${changePercent.toFixed(
            1,
          )}% based on recent trend, so comparing nearby markets may be the safer choice.`

  return {
    currentPrice,
    range,
    midpoint,
    trend,
    confidence,
    decision,
    reason,
  }
}

export function getPotentialRevenue(
  forecast: ForecastResult,
  quantityInQuintals: number,
) {
  const current =
    forecast.currentPrice * quantityInQuintals

  const future =
    forecast.midpoint * quantityInQuintals

  return {
    current,
    future,
    difference: future - current,
  }
}

export const historicalSeries = {
  Onion: {
    '7 Days': [
      2480,
      2520,
      2490,
      2570,
      2540,
      2620,
      2650,
    ],
    '30 Days': [
      2320,
      2400,
      2380,
      2460,
      2490,
      2550,
      2570,
      2650,
    ],
    '6 Months': [
      2100,
      2240,
      2360,
      2290,
      2470,
      2520,
      2580,
      2650,
    ],
  },

  Tomato: {
    '7 Days': [
      2050,
      2110,
      2080,
      2150,
      2130,
      2160,
      2180,
    ],
    '30 Days': [
      1980,
      2020,
      2050,
      2100,
      2120,
      2150,
      2160,
      2180,
    ],
    '6 Months': [
      1850,
      1920,
      1990,
      2050,
      2100,
      2140,
      2160,
      2180,
    ],
  },

  Wheat: {
    '7 Days': [
      2480,
      2460,
      2440,
      2450,
      2430,
      2425,
      2420,
    ],
    '30 Days': [
      2520,
      2500,
      2480,
      2460,
      2450,
      2440,
      2430,
      2420,
    ],
    '6 Months': [
      2600,
      2550,
      2520,
      2490,
      2470,
      2450,
      2430,
      2420,
    ],
  },

  Soybean: {
    '7 Days': [
      4550,
      4580,
      4610,
      4630,
      4650,
      4670,
      4680,
    ],
    '30 Days': [
      4420,
      4480,
      4520,
      4570,
      4610,
      4640,
      4660,
      4680,
    ],
    '6 Months': [
      4200,
      4300,
      4380,
      4460,
      4540,
      4600,
      4650,
      4680,
    ],
  },

  Cotton: {
    '7 Days': [
      7140,
      7160,
      7180,
      7190,
      7210,
      7200,
      7200,
    ],
    '30 Days': [
      7050,
      7080,
      7120,
      7150,
      7170,
      7190,
      7200,
      7200,
    ],
    '6 Months': [
      6900,
      6980,
      7040,
      7100,
      7140,
      7170,
      7190,
      7200,
    ],
  },

  Potato: {
    '7 Days': [
      1880,
      1900,
      1920,
      1930,
      1940,
      1950,
      1950,
    ],
    '30 Days': [
      1800,
      1840,
      1870,
      1900,
      1920,
      1930,
      1940,
      1950,
    ],
    '6 Months': [
      1700,
      1760,
      1810,
      1860,
      1900,
      1930,
      1940,
      1950,
    ],
  },

  Maize: {
    '7 Days': [
      2310,
      2300,
      2290,
      2280,
      2270,
      2260,
      2260,
    ],
    '30 Days': [
      2380,
      2360,
      2340,
      2320,
      2300,
      2280,
      2270,
      2260,
    ],
    '6 Months': [
      2500,
      2460,
      2420,
      2380,
      2340,
      2300,
      2280,
      2260,
    ],
  },

  Gram: {
    '7 Days': [
      5750,
      5780,
      5800,
      5820,
      5840,
      5850,
      5850,
    ],
    '30 Days': [
      5600,
      5650,
      5700,
      5750,
      5780,
      5810,
      5830,
      5850,
    ],
    '6 Months': [
      5300,
      5400,
      5500,
      5600,
      5700,
      5780,
      5820,
      5850,
    ],
  },
} as const

type CropName =
  keyof typeof historicalSeries

type TrendRange =
  keyof typeof historicalSeries.Onion

export function getTrendStats(
  cropName: CropName,
  range: TrendRange,
) {
  const values =
    historicalSeries[cropName][range]

  const first = values[0] ?? 0
  const current = values.at(-1) ?? 0

  const trend =
    current > first * 1.01
      ? 'Increasing'
      : current < first * 0.99
        ? 'Decreasing'
        : 'Stable'

  return {
    current,

    average: Math.round(
      values.reduce(
        (sum, value) => sum + value,
        0,
      ) / values.length,
    ),

    highest: Math.max(...values),

    lowest: Math.min(...values),

    trend,

    values,
  }
}