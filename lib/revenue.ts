import type { Market } from './markets'
import { calculateTransportCost } from './transport'

export type RevenueResult = {
  quantityInQuintals: number
  pricePerQuintal: number
  grossRevenue: number
  transportCost: number
  handlingCost: number
  otherCosts: number
  totalCosts: number
  netRevenue: number
}

/**
 * Estimated handling cost for the prototype.
 * This keeps non-transport selling expenses separate
 * from the transport calculation.
 */
function calculateHandlingCost(
  quantityInQuintals: number,
): number {
  const quantity = Math.max(
    0,
    quantityInQuintals,
  )

  return Math.round(quantity * 18)
}

export function calculateRevenue(
  market: Market,
  cropName: string,
  quantityInQuintals: number,
): RevenueResult {
  const quantity = Math.max(
    0,
    quantityInQuintals,
  )

  const pricePerQuintal =
    market.prices[cropName] ?? 0

  const grossRevenue =
    pricePerQuintal * quantity

  const transport =
    calculateTransportCost(
      market,
      quantity,
    )

  const handlingCost =
    calculateHandlingCost(quantity)

  // Reserved for future additional expenses
  // such as market fees, loading/unloading, etc.
  const otherCosts = 0

  const totalCosts =
    transport.totalCost +
    handlingCost +
    otherCosts

  const netRevenue =
    grossRevenue - totalCosts

  return {
    quantityInQuintals: quantity,
    pricePerQuintal,
    grossRevenue: Math.round(
      grossRevenue,
    ),
    transportCost: transport.totalCost,
    handlingCost,
    otherCosts,
    totalCosts: Math.round(
      totalCosts,
    ),
    netRevenue: Math.round(
      netRevenue,
    ),
  }
}

export function calculateRevenueDifference(
  currentRevenue: RevenueResult,
  alternativeRevenue: RevenueResult,
): number {
  return Math.round(
    alternativeRevenue.netRevenue -
      currentRevenue.netRevenue,
  )
}

