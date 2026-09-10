import type { Market } from './markets'

export type Vehicle = {
  name: string
  ratePerKm: number
  capacityQuintals: number
}

const VEHICLES: Vehicle[] = [
  { name: 'Mini Truck', ratePerKm: 23, capacityQuintals: 10 },
  { name: 'Tata Ace', ratePerKm: 26, capacityQuintals: 25 },
  { name: 'Lorry', ratePerKm: 29, capacityQuintals: 1000 },
]

export type TransportResult = {
  distanceKm: number
  vehicle: string
  ratePerKm: number
  costPerQuintal: number
  totalCost: number
}

/**
 * Estimated transport cost model for the prototype.
 *
 * Picks cheapest vehicle that can carry the quantity, cost = distance x rate/km.
 * This is a demo estimation, not a live logistics quote.
 */
export function calculateTransportCost(
  market: Market,
  quantityInQuintals: number,
): TransportResult {
  const quantity = Math.max(0, quantityInQuintals)
  const distance = Math.max(0, market.distanceKm)

  const vehicle =
    VEHICLES.find((v) => quantity <= v.capacityQuintals) ??
    VEHICLES[VEHICLES.length - 1]

  const totalCost = distance * vehicle.ratePerKm

  const costPerQuintal =
    quantity > 0
      ? totalCost / quantity
      : 0

  return {
    distanceKm: distance,
    vehicle: vehicle.name,
    ratePerKm: vehicle.ratePerKm,
    costPerQuintal: Math.round(costPerQuintal),
    totalCost: Math.round(totalCost),
  }
}