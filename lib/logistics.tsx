export type TransportOption = {
  id: string
  name: string
  capacityQuintals: number
  ratePerKm: number
  eta: string
  icon: string
}

// Sorted low → high by ratePerKm.
export const transportOptions: TransportOption[] = [
  {
    id: "mini-truck",
    name: "Mini Truck",
    capacityQuintals: 10,
    ratePerKm: 23,
    eta: "2–3 hours",
    icon: "🚚",
  },
  {
    id: "tata-ace",
    name: "Tata Ace",
    capacityQuintals: 25,
    ratePerKm: 26,
    eta: "2–3 hours",
    icon: "🚛",
  },
  {
    id: "small-lorry",
    name: "Small Lorry",
    capacityQuintals: 1000,
    ratePerKm: 29,
    eta: "3–4 hours",
    icon: "🚛",
  },
]

export function getRequiredTrips(
  quantity: number,
  capacityQuintals: number
): number {
  if (!Number.isFinite(quantity) || quantity <= 0 || capacityQuintals <= 0) {
    return 0
  }

  return Math.ceil(quantity / capacityQuintals)
}

export function getTotalTransportCost(
  quantity: number,
  distanceKm: number,
  option: TransportOption
): number {
  const trips = getRequiredTrips(quantity, option.capacityQuintals)
  const distance = Math.max(0, distanceKm)

  return trips * distance * option.ratePerKm
}

export function getCostPerQuintal(
  quantity: number,
  totalCost: number
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0
  }

  return totalCost / quantity
}

export function getLogisticsOptions(
  quantity: number,
  distanceKm: number
) {
  return transportOptions.map((option) => {
    const trips = getRequiredTrips(quantity, option.capacityQuintals)
    const totalCost = getTotalTransportCost(quantity, distanceKm, option)
    const costPerQuintal = getCostPerQuintal(quantity, totalCost)

    return {
      ...option,
      trips,
      totalCost,
      costPerQuintal,
    }
  })
}