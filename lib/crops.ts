export type CropCategory = 'Vegetable' | 'Grain' | 'Pulse' | 'Cash Crop' | 'Fruit'

export type Crop = {
  name: string
  icon: string
  category: CropCategory
}

export const crops: Crop[] = [
  { name: 'Onion', icon: '🧅', category: 'Vegetable' },
  { name: 'Tomato', icon: '🍅', category: 'Vegetable' },
  { name: 'Potato', icon: '🥔', category: 'Vegetable' },
  { name: 'Wheat', icon: '🌾', category: 'Grain' },
  { name: 'Maize', icon: '🌽', category: 'Grain' },
  { name: 'Soybean', icon: '🌱', category: 'Pulse' },
  { name: 'Gram', icon: '🫘', category: 'Pulse' },
  { name: 'Cotton', icon: '☁️', category: 'Cash Crop' },

  // Fruits
  { name: 'Banana', icon: '🍌', category: 'Fruit' },
  { name: 'Grapes', icon: '🍇', category: 'Fruit' },
  { name: 'Mango', icon: '🥭', category: 'Fruit' },
  { name: 'Pomegranate', icon: '🍎', category: 'Fruit' },
  { name: 'Orange', icon: '🍊', category: 'Fruit' },
]

export const cropCategories: CropCategory[] = [
  'Vegetable',
  'Grain',
  'Pulse',
  'Cash Crop',
  'Fruit',
]

export const defaultCrop = crops[0]

export function getCropByName(name: string): Crop {
  return crops.find((crop) => crop.name === name) ?? defaultCrop
}

export function getCropsByCategory(category: CropCategory): Crop[] {
  return crops.filter((crop) => crop.category === category)
}