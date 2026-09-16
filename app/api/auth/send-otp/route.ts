import { NextRequest, NextResponse } from 'next/server'
import { setOtp } from '@/lib/otp-store'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000))
  setOtp(phone, otp)

  // TODO: swap this console.log for a real SMS provider call
  // (Twilio, MSG91, etc.) and drop demoOtp from the response.
  console.log(`[demo] OTP for ${phone}: ${otp}`)

  return NextResponse.json({ success: true, demoOtp: otp })
}