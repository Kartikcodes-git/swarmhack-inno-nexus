export async function GET(request: Request) {
  const apiKey = process.env.AGMARKNET_API_KEY
  const { searchParams } = new URL(request.url)

  const state = searchParams.get('state') ?? 'Maharashtra'
  const commodity = searchParams.get('commodity')
  const limit = searchParams.get('limit') ?? '500'

  const url = new URL(
    'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
  )

  url.searchParams.set('api-key', apiKey ?? '')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', limit)
  url.searchParams.set('filters[state]', state)

  if (commodity) {
    url.searchParams.set('filters[commodity]', commodity)
  }

  const res = await fetch(url.toString())
  const data = await res.json()

  return Response.json(data)
}