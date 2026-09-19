'use client'

import { locations } from '@/lib/locations'
import { WeatherWidget } from '@/components/weather-widget'

/**
 * Weather, as its own screen (not on the dashboard). Has its own location
 * selector covering all Maharashtra districts, independent of the
 * crop/market location picked on the dashboard.
 */
export function WeatherPage({
  locationId,
  setLocationId,
  back,
}: {
  locationId: string
  setLocationId: (id: string) => void
  back: () => void
}) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={back}
        className="text-sm font-semibold text-primary"
      >
        ← Back to dashboard
      </button>

      <div>
        <p className="text-sm font-semibold text-primary">Weather</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">
          5-day forecast &amp; field advisories
        </h1>
        <p className="mt-2 text-muted-foreground">
          Spray, irrigation and drainage advisories, tied to the forecast for
          your district.
        </p>
      </div>

      <select
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="min-h-11 w-full max-w-sm rounded-xl border border-border px-4 text-sm sm:w-80"
      >
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}, {location.state}
          </option>
        ))}
      </select>

      <WeatherWidget locationId={locationId} />
    </div>
  )
}
