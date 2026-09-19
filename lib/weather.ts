import { getLocationById } from '@/lib/locations'

/**
 * Weather — uses OpenWeatherMap (needs OPENWEATHER_API_KEY server-side).
 * Free tier: /data/2.5/weather (current) + /data/2.5/forecast (3-hourly, 5 days).
 * We aggregate the 3-hourly forecast into daily max/min/rain/description so
 * the UI shows a clean 5-day strip, then derive farmer advisories from it —
 * these plug into bucket A's irrigation/pesticide guidance.
 */

export type DailyForecast = {
  date: string // YYYY-MM-DD
  tempMaxC: number
  tempMinC: number
  rainMm: number
  description: string
  icon: string
}

export type WeatherAdvisory = {
  kind: 'spray-hold' | 'early-irrigation' | 'drainage-check'
  message: string
}

export type WeatherSnapshot = {
  locationId: string
  locationLabel: string
  current: {
    tempC: number
    description: string
    icon: string
    humidity: number
    windSpeedMs: number
  }
  daily: DailyForecast[]
  advisories: WeatherAdvisory[]
  fetchedAt: string
}

const OWM_BASE = 'https://api.openweathermap.org/data/2.5'

type OwmCurrentResponse = {
  main: { temp: number; humidity: number }
  weather: Array<{ description: string; icon: string }>
  wind: { speed: number }
}

type OwmForecastResponse = {
  list: Array<{
    dt: number
    dt_txt: string
    main: { temp_max: number; temp_min: number }
    weather: Array<{ description: string; icon: string }>
    rain?: { '3h'?: number }
  }>
}

export class WeatherError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'WeatherError'
  }
}

export async function fetchWeatherSnapshot(
  locationId: string,
): Promise<WeatherSnapshot> {
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    throw new WeatherError('Missing OPENWEATHER_API_KEY', 500)
  }

  const location = getLocationById(locationId)

  const currentUrl = new URL(`${OWM_BASE}/weather`)
  currentUrl.searchParams.set('lat', String(location.lat))
  currentUrl.searchParams.set('lon', String(location.lng))
  currentUrl.searchParams.set('units', 'metric')
  currentUrl.searchParams.set('appid', apiKey)

  const forecastUrl = new URL(`${OWM_BASE}/forecast`)
  forecastUrl.searchParams.set('lat', String(location.lat))
  forecastUrl.searchParams.set('lon', String(location.lng))
  forecastUrl.searchParams.set('units', 'metric')
  forecastUrl.searchParams.set('appid', apiKey)

  const [currentRes, forecastRes] = await Promise.all([
    fetch(currentUrl.toString(), { next: { revalidate: 900 } }),
    fetch(forecastUrl.toString(), { next: { revalidate: 900 } }),
  ])

  if (!currentRes.ok || !forecastRes.ok) {
    throw new WeatherError(
      `OpenWeather upstream error (${currentRes.status}/${forecastRes.status})`,
      502,
    )
  }

  const current: OwmCurrentResponse = await currentRes.json()
  const forecast: OwmForecastResponse = await forecastRes.json()

  const daily = aggregateDaily(forecast.list)
  const advisories = buildWeatherAdvisories(daily)

  return {
    locationId: location.id,
    locationLabel: `${location.name}, ${location.state}`,
    current: {
      tempC: Math.round(current.main.temp),
      description: current.weather[0]?.description ?? 'unknown',
      icon: current.weather[0]?.icon ?? '01d',
      humidity: current.main.humidity,
      windSpeedMs: current.wind.speed,
    },
    daily,
    advisories,
    fetchedAt: new Date().toISOString(),
  }
}

/** Collapse OpenWeather's 3-hourly buckets into one row per calendar day. */
function aggregateDaily(
  list: OwmForecastResponse['list'],
): DailyForecast[] {
  const byDate = new Map<
    string,
    {
      max: number
      min: number
      rain: number
      description: string
      icon: string
      middayDistance: number
    }
  >()

  for (const entry of list) {
    const date = entry.dt_txt.slice(0, 10)
    const hour = Number(entry.dt_txt.slice(11, 13))
    const middayDistance = Math.abs(hour - 13)
    const rain = entry.rain?.['3h'] ?? 0
    const existing = byDate.get(date)

    if (!existing) {
      byDate.set(date, {
        max: entry.main.temp_max,
        min: entry.main.temp_min,
        rain,
        description: entry.weather[0]?.description ?? 'unknown',
        icon: entry.weather[0]?.icon ?? '01d',
        middayDistance,
      })
      continue
    }

    existing.max = Math.max(existing.max, entry.main.temp_max)
    existing.min = Math.min(existing.min, entry.main.temp_min)
    existing.rain += rain

    // Prefer the description/icon closest to midday — most representative.
    if (middayDistance < existing.middayDistance) {
      existing.description = entry.weather[0]?.description ?? existing.description
      existing.icon = entry.weather[0]?.icon ?? existing.icon
      existing.middayDistance = middayDistance
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5)
    .map(([date, agg]) => ({
      date,
      tempMaxC: Math.round(agg.max),
      tempMinC: Math.round(agg.min),
      rainMm: Math.round(agg.rain * 10) / 10,
      description: agg.description,
      icon: agg.icon,
    }))
}

/**
 * Derive advisories from the daily forecast. These are meant to be read
 * alongside bucket A's irrigation/pesticide guidance, not replace it:
 * - Rain in the next 48h → hold pesticide/fungicide spray (washes off, wasted).
 * - Heat with no rain in the next 48h → irrigate early morning to cut loss.
 * - Heavy rain (>20mm/day) → check field drainage to avoid waterlogging.
 */
export function buildWeatherAdvisories(
  daily: DailyForecast[],
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = []
  const next48h = daily.slice(0, 2)

  const rainComing = next48h.some((day) => day.rainMm > 2)
  const heavyRainComing = daily.some((day) => day.rainMm > 20)
  const hotAndDry =
    !rainComing && next48h.some((day) => day.tempMaxC >= 35)

  if (rainComing) {
    advisories.push({
      kind: 'spray-hold',
      message:
        'Rain expected in the next 2 days — hold off on pesticide/fungicide spray, it will wash off.',
    })
  }

  if (hotAndDry) {
    advisories.push({
      kind: 'early-irrigation',
      message:
        'Hot, dry days ahead — irrigate early morning or evening to reduce water loss to evaporation.',
    })
  }

  if (heavyRainComing) {
    advisories.push({
      kind: 'drainage-check',
      message:
        'Heavy rain expected — check field drainage now to avoid waterlogging.',
    })
  }

  return advisories
}
