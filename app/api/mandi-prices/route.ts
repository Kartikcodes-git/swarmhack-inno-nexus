export async function GET(request: Request) {
  const apiKey = process.env.AGMARKNET_API_KEY

  if (!apiKey) {
    console.error('[mandi-prices] AGMARKNET_API_KEY missing in env')
    return Response.json({ error: 'Missing AGMARKNET_API_KEY', records: [] }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') ?? 'Maharashtra'
  const commodity = searchParams.get('commodity')
  const limit = searchParams.get('limit') ?? '500'

  const url = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070')
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', limit)
  url.searchParams.set('filters[state]', state)
  if (commodity) url.searchParams.set('filters[commodity]', commodity)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })

    if (!res.ok) {
      console.error('[mandi-prices] upstream error', res.status)
      return Response.json({ error: `Upstream ${res.status}`, records: [] }, { status: 502 })
    }

    const data = await res.json()

    if (!Array.isArray(data.records)) {
      console.error('[mandi-prices] unexpected shape', data)
      return Response.json({ error: 'Unexpected response shape', records: [] }, { status: 502 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('[mandi-prices] fetch failed', err)
    return Response.json({ error: 'Fetch failed', records: [] }, { status: 500 })
  }
}