export type TransportOption = {
  id: string
  name: string
  capacity: number
  baseCostPerTrip: number
  eta: string
  icon: string
}

export const transportOptions: TransportOption[] = [
  {
    id: "mini-truck",
    name: "Mini Truck",
    capacity: 5,
    baseCostPerTrip: 1800,
    eta: "2–3 hours",
    icon: "🚚",
  },
  {
    id: "tata-ace",
    name: "Tata Ace",
    capacity: 10,
    baseCostPerTrip: 2400,
    eta: "2–3 hours",
    icon: "🚛",
  },
  {
    id: "small-lorry",
    name: "Small Lorry",
    capacity: 20,
    baseCostPerTrip: 3200,
    eta: "3–4 hours",
    icon: "🚛",
  },
]

export function getRequiredTrips(
  quantity: number,
  capacity: number
): number {
  if (!Number.isFinite(quantity) || quantity <= 0 || capacity <= 0) {
    return 0
  }

  return Math.ceil(quantity / capacity)
}

export function getTotalTransportCost(
  quantity: number,
  option: TransportOption
): number {
  const trips = getRequiredTrips(quantity, option.capacity)

  return trips * option.baseCostPerTrip
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

export function getLogisticsOptions(quantity: number) {
  return transportOptions.map((option) => {
    const trips = getRequiredTrips(quantity, option.capacity)
    const totalCost = getTotalTransportCost(quantity, option)
    const costPerQuintal = getCostPerQuintal(quantity, totalCost)

    return {
      ...option,
      trips,
      totalCost,
      costPerQuintal,
    }
  })
}