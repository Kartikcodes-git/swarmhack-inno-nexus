export type Location = {
  id: string
  name: string
  district: string
  state: string
}

export const locations: Location[] = [
  {
    id: 'nashik',
    name: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
  },
  {
    id: 'pune',
    name: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
  },
  {
    id: 'aurangabad',
    name: 'Aurangabad',
    district: 'Aurangabad',
    state: 'Maharashtra',
  },
  {
    id: 'ahmednagar',
    name: 'Ahmednagar',
    district: 'Ahmednagar',
    state: 'Maharashtra',
  },
  {
    id: 'dhule',
    name: 'Dhule',
    district: 'Dhule',
    state: 'Maharashtra',
  },
  {
    id: 'jalgaon',
    name: 'Jalgaon',
    district: 'Jalgaon',
    state: 'Maharashtra',
  },
]

export const defaultLocation = locations[0]

export function getLocationById(
  locationId: string,
): Location {
  return (
    locations.find(
      (location) => location.id === locationId,
    ) ?? defaultLocation
  )
}

export function getLocationLabel(
  locationId: string,
): string {
  const location = getLocationById(locationId)

  return `${location.name}, ${location.state}`
}

