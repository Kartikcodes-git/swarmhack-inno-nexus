import { z } from 'zod'
import { NextResponse } from 'next/server'
import { AuthError } from '@/lib/supabase/server'
import type { ApiResult } from '@/lib/types/db'

/**
 * Requirement #11: every route validates its input here, server-side.
 * Client-side validation is a UX convenience only — it is never trusted.
 */

const phone = z
  .string()
  .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number')

const grade = z.enum(['A', 'B', 'C'])

const cropCategory = z.enum([
  'Vegetable',
  'Grain',
  'Pulse',
  'Cash Crop',
  'Fruit',
])

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
// NOTE: `role` is accepted at SIGNUP ONLY, and is written once. It is never
// accepted on update — the DB trigger `profiles_role_immutable` blocks that
// even if this layer were bypassed.

export const createFarmerProfileSchema = z.object({
  role: z.literal('farmer'),
  fullName: z.string().trim().min(2).max(80),
  phone,
  locationId: z.string().trim().min(1).max(60),
  // Compulsory now — a farmer cannot sign up without an ID document.
  farmerIdUrl: z.string().url().max(2000),
  landSizeAcres: z.number().positive().max(100000).optional().nullable(),
})

export const createBuyerProfileSchema = z.object({
  role: z.literal('buyer'),
  fullName: z.string().trim().min(2).max(80),
  phone,
  locationId: z.string().trim().min(1).max(60).optional().nullable(),
  companyName: z.string().trim().min(2).max(120),
  businessType: z.string().trim().max(80).optional().nullable(),
  gstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Enter a valid GSTIN',
    )
    .optional()
    .nullable(),
  businessAddress: z.string().trim().max(300).optional().nullable(),
})

export const createProfileSchema = z.discriminatedUnion('role', [
  createFarmerProfileSchema,
  createBuyerProfileSchema,
])

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
  locationId: z.string().trim().min(1).max(60).optional(),
  farmerIdUrl: z.string().url().max(2000).nullable().optional(),
  landSizeAcres: z.number().positive().max(100000).nullable().optional(),
  companyName: z.string().trim().min(2).max(120).optional(),
  businessType: z.string().trim().max(80).nullable().optional(),
  gstin: z.string().trim().max(20).nullable().optional(),
  businessAddress: z.string().trim().max(300).nullable().optional(),
})

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export const createListingSchema = z.object({
  cropName: z.string().trim().min(2).max(60),
  cropCategory,
  quantityQuintals: z.coerce.number().positive().max(10000),
  pricePerQuintal: z.coerce.number().positive().max(1_000_000),
  locationId: z.string().trim().min(1).max(60),
  grade,
})

export const updateListingSchema = createListingSchema
  .partial()
  .extend({
    status: z.enum(['active', 'sold', 'withdrawn']).optional(),
  })

export const listingFiltersSchema = z.object({
  crop: z.string().trim().max(60).optional(),
  category: cropCategory.optional(),
  locationId: z.string().trim().max(60).optional(),
  grade: grade.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
})

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------
// There is deliberately NO buyerCompany field. The server reads it from the
// authenticated buyer's profile. Requirement #5.

export const createOfferSchema = z.object({
  listingId: z.string().uuid(),
  quantityQuintals: z.coerce.number().positive().max(10000),
  offerPrice: z.coerce.number().positive().max(1_000_000),
  message: z.string().trim().max(500).optional(),
})

export const respondToOfferSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept') }),
  z.object({ action: z.literal('reject') }),
  z.object({
    action: z.literal('counter'),
    counterPrice: z.coerce.number().positive().max(1_000_000),
  }),
  z.object({
    action: z.literal('complete'),
    finalGrade: grade,
    finalPrice: z.coerce.number().positive().max(1_000_000),
  }),
])

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------
// Only offerId + stars + comment. farmerId and buyerId are derived from the
// offer server-side, so a caller cannot rate a farmer they never bought from
// by passing someone else's id.

export const createRatingSchema = z.object({
  offerId: z.string().uuid(),
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
})

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResult<T>>({ ok: true, data }, { status })
}

export function fail(
  error: string,
  status = 400,
  fieldErrors?: Record<string, string>,
) {
  return NextResponse.json<ApiResult<never>>(
    { ok: false, error, fieldErrors },
    { status },
  )
}

/** Turns a zod error into the flat shape the frontend renders. */
export function zodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {}

  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'

    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }

  return fieldErrors
}

/**
 * Wraps a route handler so auth failures, validation failures and unexpected
 * errors all come back in the same envelope — never a raw stack trace.
 */
export async function handleRoute<T>(
  fn: () => Promise<Response>,
): Promise<Response> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status)
    }

    if (error instanceof z.ZodError) {
      return fail('Please check the highlighted fields.', 422, zodFieldErrors(error))
    }

    console.error('[api]', error)

    return fail('Something went wrong. Please try again.', 500)
  }
}