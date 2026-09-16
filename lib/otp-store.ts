type OtpEntry = { otp: string; expiresAt: number }

// Prototype-only in-memory store. Resets on server restart / cold start,
// and won't work across multiple server instances.
// Swap for Redis, or a Postgres table (phone, otp_hash, expires_at), in production.
const store = new Map<string, OtpEntry>()

export function setOtp(phone: string, otp: string) {
  store.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 })
}

export function checkOtp(phone: string, otp: string) {
  const entry = store.get(phone)

  if (!entry) return false

  if (Date.now() > entry.expiresAt) {
    store.delete(phone)
    return false
  }

  const ok = entry.otp === otp

  if (ok) store.delete(phone)

  return ok
}