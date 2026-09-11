export type LiveMandiRecord = {
  state: string
  district: string
  market: string
  commodity: string
  arrival_date: string
  min_price: string
  max_price: string
  modal_price: string
}

/**
 * Calls our own /api/mandi-prices route (never the data.gov.in URL
 * directly — that's server-only, keeps the API key off the client).
 */
export async function fetchLivePrices(
  commodity: string,
  state = 'Maharashtra',
): Promise<LiveMandiRecord[]> {
  const url = new URL('/api/mandi-prices', window.location.origin)
  url.searchParams.set('state', state)
  url.searchParams.set('commodity', commodity)

  const res = await fetch(url.toString())

  if (!res.ok) {
    return []
  }

  const data = await res.json()

  return Array.isArray(data.records) ? data.records : []
}

/**
 * Agmarknet returns one row per market/variety/grade, so a district
 * can have several rows for the same commodity. Picks the modal
 * price from the most recent arrival_date for that district.
 */
export function pickDistrictModalPrice(
  records: LiveMandiRecord[],
  district: string,
): number | null {
  const matches = records.filter(
    (r) =>
      r.district?.trim().toLowerCase() ===
      district.trim().toLowerCase(),
  )

  if (matches.length === 0) {
    return null
  }

  matches.sort((a, b) =>
    b.arrival_date.localeCompare(a.arrival_date),
  )

  const price = Number(matches[0].modal_price)

  return Number.isFinite(price) && price > 0 ? price : null
}