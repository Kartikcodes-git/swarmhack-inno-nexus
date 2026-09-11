export async function GET() {
  const apiKey = process.env.AGMARKNET_API_KEY

  const res = await fetch(
    `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json`
  )

  const data = await res.json()

  return Response.json(data)
}