export type Location = {
  id: string
  name: string
  district: string
  state: string
  lat: number
  lng: number
}

/**
 * All 36 Maharashtra districts, so the location dropdown (signup, weather,
 * dashboard) isn't limited to the 6 markets in lib/markets.ts. `district`
 * matches the Agmarknet `district` field, used to join live mandi prices
 * (lib/live-prices.ts) — keep this in sync with official district names.
 */
export const locations: Location[] = [
  { id: 'ahmednagar', name: 'Ahmednagar', district: 'Ahmednagar', state: 'Maharashtra', lat: 19.0952, lng: 74.7496 },
  { id: 'akola', name: 'Akola', district: 'Akola', state: 'Maharashtra', lat: 20.7002, lng: 77.0082 },
  { id: 'amravati', name: 'Amravati', district: 'Amravati', state: 'Maharashtra', lat: 20.9374, lng: 77.7796 },
  { id: 'aurangabad', name: 'Chhatrapati Sambhajinagar', district: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  { id: 'beed', name: 'Beed', district: 'Beed', state: 'Maharashtra', lat: 18.9891, lng: 75.7601 },
  { id: 'bhandara', name: 'Bhandara', district: 'Bhandara', state: 'Maharashtra', lat: 21.1665, lng: 79.6519 },
  { id: 'buldhana', name: 'Buldhana', district: 'Buldhana', state: 'Maharashtra', lat: 20.5293, lng: 76.1809 },
  { id: 'chandrapur', name: 'Chandrapur', district: 'Chandrapur', state: 'Maharashtra', lat: 19.9615, lng: 79.2961 },
  { id: 'dhule', name: 'Dhule', district: 'Dhule', state: 'Maharashtra', lat: 20.9042, lng: 74.7749 },
  { id: 'gadchiroli', name: 'Gadchiroli', district: 'Gadchiroli', state: 'Maharashtra', lat: 20.1809, lng: 80.0021 },
  { id: 'gondia', name: 'Gondia', district: 'Gondia', state: 'Maharashtra', lat: 21.4602, lng: 80.1922 },
  { id: 'hingoli', name: 'Hingoli', district: 'Hingoli', state: 'Maharashtra', lat: 19.7148, lng: 77.1489 },
  { id: 'jalgaon', name: 'Jalgaon', district: 'Jalgaon', state: 'Maharashtra', lat: 21.0077, lng: 75.5626 },
  { id: 'jalna', name: 'Jalna', district: 'Jalna', state: 'Maharashtra', lat: 19.8410, lng: 75.8864 },
  { id: 'kolhapur', name: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433 },
  { id: 'latur', name: 'Latur', district: 'Latur', state: 'Maharashtra', lat: 18.4088, lng: 76.5604 },
  { id: 'mumbai', name: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'mumbai-suburban', name: 'Mumbai Suburban', district: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.1176, lng: 72.9060 },
  { id: 'nagpur', name: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { id: 'nanded', name: 'Nanded', district: 'Nanded', state: 'Maharashtra', lat: 19.1383, lng: 77.3210 },
  { id: 'nandurbar', name: 'Nandurbar', district: 'Nandurbar', state: 'Maharashtra', lat: 21.3667, lng: 74.2400 },
  { id: 'nashik', name: 'Nashik', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { id: 'osmanabad', name: 'Dharashiv', district: 'Osmanabad', state: 'Maharashtra', lat: 18.1860, lng: 76.0419 },
  { id: 'palghar', name: 'Palghar', district: 'Palghar', state: 'Maharashtra', lat: 19.6969, lng: 72.7649 },
  { id: 'parbhani', name: 'Parbhani', district: 'Parbhani', state: 'Maharashtra', lat: 19.2704, lng: 76.7602 },
  { id: 'pune', name: 'Pune', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { id: 'raigad', name: 'Raigad', district: 'Raigad', state: 'Maharashtra', lat: 18.5158, lng: 73.1822 },
  { id: 'ratnagiri', name: 'Ratnagiri', district: 'Ratnagiri', state: 'Maharashtra', lat: 16.9902, lng: 73.3120 },
  { id: 'sangli', name: 'Sangli', district: 'Sangli', state: 'Maharashtra', lat: 16.8524, lng: 74.5815 },
  { id: 'satara', name: 'Satara', district: 'Satara', state: 'Maharashtra', lat: 17.6805, lng: 74.0183 },
  { id: 'sindhudurg', name: 'Sindhudurg', district: 'Sindhudurg', state: 'Maharashtra', lat: 16.3667, lng: 73.6833 },
  { id: 'solapur', name: 'Solapur', district: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064 },
  { id: 'thane', name: 'Thane', district: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  { id: 'wardha', name: 'Wardha', district: 'Wardha', state: 'Maharashtra', lat: 20.7453, lng: 78.6022 },
  { id: 'washim', name: 'Washim', district: 'Washim', state: 'Maharashtra', lat: 20.1097, lng: 77.1333 },
  { id: 'yavatmal', name: 'Yavatmal', district: 'Yavatmal', state: 'Maharashtra', lat: 20.3888, lng: 78.1204 },
]

export const defaultLocation = locations.find((l) => l.id === 'nashik')!

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
