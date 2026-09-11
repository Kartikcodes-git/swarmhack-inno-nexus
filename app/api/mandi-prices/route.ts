export async function GET() {
  const apiKey = process.env.AGMARKNET_API_KEY
  const res = await fetch(`https://api.data.gov.in/resource/YOUR_RESOURCE_ID?api-key=${apiKey}&format=json`)
  const text = await res.text()
  console.log(text) // dekhne ke liye
  return new Response(text)
}