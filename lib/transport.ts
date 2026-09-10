import type { Market } from './markets'

export type TransportResult = {
  distanceKm: number
  costPerQuintal: number
  totalCost: number
}

/**
 * Estimated transport cost model for the prototype.
 *
 * Cost increases with distance and quantity.
 * This is a demo estimation, not a live logistics quote.
 */
export function calculateTransportCost(
  market: Market,
  quantityInQuintals: number,
): TransportResult {
  const quantity = Math.max(0, quantityInQuintals)
  const distance = Math.max(0, market.distanceKm)

  // Base vehicle/handling component
  const baseCost = 250

  // Distance component
  const distanceCost = distance * 8

  // Quantity component
  const quantityCost = quantity * 12

  const totalCost =
    baseCost +
    distanceCost +
    quantityCost

  const costPerQuintal =
    quantity > 0
      ? totalCost / quantity
      : 0

  return {
    distanceKm: distance,
    costPerQuintal: Math.round(
      costPerQuintal,
    ),
    totalCost: Math.round(totalCost),
  }
}

