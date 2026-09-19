export type Location = {
  id: string
  name: string
  district: string
  state: string
  lat: number
  lng: number
}

export const locations: Location[] = [
  {
    id: 'nashik',
    name: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    lat: 19.9975,
    lng: 73.7898,
  },
  {
    id: 'pune',
    name: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    id: 'aurangabad',
    name: 'Aurangabad',
    district: 'Aurangabad',
    state: 'Maharashtra',
    lat: 19.8762,
    lng: 75.3433,
  },
  {
    id: 'ahmednagar',
    name: 'Ahmednagar',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    lat: 19.0952,
    lng: 74.7496,
  },
  {
    id: 'dhule',
    name: 'Dhule',
    district: 'Dhule',
    state: 'Maharashtra',
    lat: 20.9042,
    lng: 74.7749,
  },
  {
    id: 'jalgaon',
    name: 'Jalgaon',
    district: 'Jalgaon',
    state: 'Maharashtra',
    lat: 21.0077,
    lng: 75.5626,
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

