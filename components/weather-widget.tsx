'use client'

import { api } from '@/lib/api-client'
import { useAsync } from '@/lib/hooks/use-async'
import type { WeatherSnapshot, WeatherAdvisory } from '@/lib/weather'

const ADVISORY_STYLE: Record<
  WeatherAdvisory['kind'],
  { icon: string; tone: string }
> = {
  'spray-hold': { icon: '🚫', tone: 'bg-amber-100 text-amber-900' },
  'early-irrigation': { icon: '💧', tone: 'bg-sky-100 text-sky-800' },
  'drainage-check': { icon: '🌊', tone: 'bg-red-100 text-red-800' },
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', { weekday: 'short' })
}

/**
 * 5-day forecast + farmer advisories, sourced from OpenWeatherMap
 * (server-side key, see lib/weather.ts). Advisories link back into bucket
 * A's irrigation/pesticide guidance — this doesn't replace that, it tells
 * the farmer *when* to act on it.
 *
 * Drop into the farmer dashboard, above the recommendations feed:
 *   <WeatherWidget locationId={locationId} />
 */
export function WeatherWidget({ locationId }: { locationId: string }) {
  const { data, isLoading, error } = useAsync<WeatherSnapshot>(
    () => api.weather.forecast(locationId),
    [locationId],
  )

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Loading weather…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        {error ?? 'Weather is unavailable right now.'}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weather · {data.locationLabel}
          </p>
          <p className="mt-1 text-2xl font-bold">
            {data.current.tempC}°C
            <span className="ml-2 text-sm font-normal capitalize text-muted-foreground">
              {data.current.description}
            </span>
          </p>
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${data.current.icon}@2x.png`}
          alt={data.current.description}
          className="h-14 w-14"
        />
      </div>

      {data.advisories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.advisories.map((advisory) => {
            const style = ADVISORY_STYLE[advisory.kind]
            return (
              <span
                key={advisory.kind}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.tone}`}
                title={advisory.message}
              >
                {style.icon} {advisory.message}
              </span>
            )
          })}
        </div>
      )}

      <div className="mt-4 grid grid-cols-5 gap-2">
        {data.daily.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center rounded-xl bg-muted p-2 text-center"
          >
            <span className="text-xs font-semibold">{dayLabel(day.date)}</span>
            <img
              src={`https://openweathermap.org/img/wn/${day.icon}.png`}
              alt={day.description}
              className="h-8 w-8"
            />
            <span className="text-xs">
              {day.tempMaxC}°/{day.tempMinC}°
            </span>
            {day.rainMm > 0 && (
              <span className="text-[10px] text-sky-700">{day.rainMm}mm</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
