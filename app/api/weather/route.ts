import { fail, ok } from '@/lib/validation'
import { fetchWeatherSnapshot, WeatherError } from '@/lib/weather'
import { defaultLocation } from '@/lib/locations'

export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* GET /api/weather?locationId=nashik                                        */
/* No auth required — weather is read-only public data, same shape for every */
/* role. Falls back to defaultLocation if locationId is missing/invalid.     */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get('locationId') ?? defaultLocation.id

  try {
    const snapshot = await fetchWeatherSnapshot(locationId)
    return ok(snapshot)
  } catch (error) {
    if (error instanceof WeatherError) {
      console.error('[weather]', error.message)
      return fail(error.message, error.status)
    }

    console.error('[weather] unexpected', error)
    return fail('Could not load weather.', 500)
  }
}
