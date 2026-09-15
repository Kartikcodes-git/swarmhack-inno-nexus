export type MarketDemand = 'HIGH' | 'MEDIUM' | 'LOW'

export type PriceTrend =
  | 'Increasing'
  | 'Stable'
  | 'Decreasing'

export type Market = {
  id: string
  name: string
  locationId: string
  district: string
  distanceKm: number
  demand: MarketDemand
  priceTrend: PriceTrend
  prices: Record<string, number>
}

export const markets: Market[] = [
  {
    id: 'nashik-apmc',
    name: 'Nashik APMC',
    locationId: 'nashik',
    district: 'Nashik',
    distanceKm: 8,
    demand: 'HIGH',
    priceTrend: 'Increasing',
    prices: {
      Onion: 2650,
      Tomato: 2180,
      Wheat: 2420,
      Soybean: 4680,
      Cotton: 7200,
      Potato: 1950,
      Maize: 2260,
      Gram: 5850,
      Banana: 1850,
      Grapes: 6200,
      Mango: 8500,
      Pomegranate: 9200,
      Orange: 3400,
    },
  },

  {
    id: 'pune-apmc',
    name: 'Pune APMC',
    locationId: 'pune',
    district: 'Pune',
    distanceKm: 185,
    demand: 'HIGH',
    priceTrend: 'Stable',
    prices: {
      Onion: 2780,
      Tomato: 2260,
      Wheat: 2490,
      Soybean: 4760,
      Cotton: 7280,
      Potato: 2020,
      Maize: 2310,
      Gram: 5920,
      Banana: 1930,
      Grapes: 6480,
      Mango: 8850,
      Pomegranate: 9500,
      Orange: 3560,
    },
  },

  {
    id: 'chhatrapati-sambhajinagar-apmc',
    name: 'Chhatrapati Sambhajinagar APMC',
    locationId: 'aurangabad',
    district: 'Chhatrapati Sambhajinagar',
    distanceKm: 210,
    demand: 'MEDIUM',
    priceTrend: 'Increasing',
    prices: {
      Onion: 2710,
      Tomato: 2210,
      Wheat: 2460,
      Soybean: 4720,
      Cotton: 7240,
      Potato: 1990,
      Maize: 2290,
      Gram: 5890,
      Banana: 1890,
      Grapes: 6310,
      Mango: 8640,
      Pomegranate: 9330,
      Orange: 3470,
    },
  },

  {
    id: 'ahmednagar-apmc',
    name: 'Ahmednagar APMC',
    locationId: 'ahmednagar',
    district: 'Ahmednagar',
    distanceKm: 85,
    demand: 'MEDIUM',
    priceTrend: 'Stable',
    prices: {
      Onion: 2690,
      Tomato: 2190,
      Wheat: 2440,
      Soybean: 4700,
      Cotton: 7210,
      Potato: 1980,
      Maize: 2270,
      Gram: 5870,
      Banana: 1870,
      Grapes: 6260,
      Mango: 8570,
      Pomegranate: 9270,
      Orange: 3430,
    },
  },

  {
    id: 'dhule-apmc',
    name: 'Dhule APMC',
    locationId: 'dhule',
    district: 'Dhule',
    distanceKm: 150,
    demand: 'LOW',
    priceTrend: 'Decreasing',
    prices: {
      Onion: 2580,
      Tomato: 2120,
      Wheat: 2380,
      Soybean: 4610,
      Cotton: 7130,
      Potato: 1910,
      Maize: 2200,
      Gram: 5790,
      Banana: 1790,
      Grapes: 6020,
      Mango: 8260,
      Pomegranate: 8980,
      Orange: 3290,
    },
  },

  {
    id: 'jalgaon-apmc',
    name: 'Jalgaon APMC',
    locationId: 'jalgaon',
    district: 'Jalgaon',
    distanceKm: 165,
    demand: 'HIGH',
    priceTrend: 'Increasing',
    prices: {
      Onion: 2730,
      Tomato: 2200,
      Wheat: 2470,
      Soybean: 4750,
      Cotton: 7260,
      Potato: 2010,
      Maize: 2300,
      Gram: 5910,
      Banana: 1980,
      Grapes: 6390,
      Mango: 8760,
      Pomegranate: 9420,
      Orange: 3520,
    },
  },
]

export function getMarketsForLocation(
  locationId: string,
): Market[] {
  return markets.map((market) => ({
    ...market,
    distanceKm:
      market.locationId === locationId
        ? 8
        : market.distanceKm,
  }))
}

export function getMarketPrice(
  market: Market,
  cropName: string,
): number {
  return market.prices[cropName] ?? 0
}

export function getMarketById(
  marketId: string,
): Market | undefined {
  return markets.find(
    (market) => market.id === marketId,
  )
}