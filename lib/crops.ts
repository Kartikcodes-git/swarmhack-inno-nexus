export type Crop = {
  name: string
  icon: string
}

export const crops: Crop[] = [
  { name: 'Onion', icon: '🧅' },
  { name: 'Tomato', icon: '🍅' },
  { name: 'Wheat', icon: '🌾' },
  { name: 'Soybean', icon: '🌱' },
  { name: 'Cotton', icon: '☁️' },
  { name: 'Potato', icon: '🥔' },
  { name: 'Maize', icon: '🌽' },
  { name: 'Gram', icon: '🫘' },
]

export const defaultCrop = crops[0]

export function getCropByName(name: string): Crop {
  return crops.find((crop) => crop.name === name) ?? defaultCrop
}