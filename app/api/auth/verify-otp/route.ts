import { NextRequest, NextResponse } from 'next/server'
import { checkOtp } from '@/lib/otp-store'

export async function POST(req: NextRequest) {
  const { phone, otp, name, role } = await req.json()

  if (!checkOtp(phone, otp)) {
    return NextResponse.json({ error: 'Incorrect OTP' }, { status: 401 })
  }

  // TODO: upsert a user row (phone, name, role) in Postgres here,
  // then issue a real session (signed cookie / JWT) instead of this
  // stub — right now the client just trusts this 200 response.
  // e.g. with Prisma:
  //   await prisma.user.upsert({
  //     where: { phone },
  //     update: { name, role },
  //     create: { phone, name, role },
  //   })

  return NextResponse.json({ success: true, phone, name, role })
}