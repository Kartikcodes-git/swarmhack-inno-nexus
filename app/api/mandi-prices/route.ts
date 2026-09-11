export async function GET() {
  const apiKey = process.env.AGMARKNET_API_KEY
  const res = await fetch(`https://api.data.gov.in/resource/...?api-key=${apiKey}`)
  const data = await res.json()
  return Response.json(data)
}