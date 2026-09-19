import type {
  ApiResult,
  CropCategory,
  Listing,
  ListingFilters,
  Offer,
  QualityGrade,
  Rating,
  RatingSummary,
  AnyProfile,
  CropMsp,
  CropCareGuideline,
  CropRecommendation,
  FarmerCropHistoryEntry,
} from '@/lib/types/db'
import type { WeatherSnapshot } from '@/lib/weather'

/**
 * The ONLY place the frontend talks to the backend.
 *
 * Requirement #16: to move off Supabase, you rewrite lib/supabase/* and the
 * route handlers. This file's signatures stay identical, so nothing in
 * components/ or app/page.tsx changes.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function call<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    // network-level failure — distinct from a 4xx/5xx
    throw new ApiError(
      'Cannot reach KrishiSetu. Check your connection.',
      0,
    )
  }

  let payload: ApiResult<T>

  try {
    payload = await response.json()
  } catch {
    throw new ApiError('Unexpected response from the server.', response.status)
  }

  if (!payload.ok) {
    throw new ApiError(payload.error, response.status, payload.fieldErrors)
  }

  return payload.data
}

function toQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }

  const query = params.toString()

  return query ? `?${query}` : ''
}

/* -------------------------------------------------------------------------- */

export const api = {
  profile: {
    me: () => call<AnyProfile>('/api/profile'),

    create: (input: unknown) =>
      call<AnyProfile>('/api/profile', {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    update: (input: unknown) =>
      call<AnyProfile>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  },

  listings: {
    list: (filters: ListingFilters = {}) =>
      call<Listing[]>(`/api/listings${toQuery(filters)}`),

    create: (input: {
      cropName: string
      cropCategory: CropCategory
      quantityQuintals: number
      pricePerQuintal: number
      locationId: string
      grade: QualityGrade
    }) =>
      call<{ id: string }>('/api/listings', {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    update: (id: string, input: Record<string, unknown>) =>
      call<{ id: string }>(`/api/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),

    remove: (id: string) =>
      call<{ deleted: boolean }>(`/api/listings/${id}`, {
        method: 'DELETE',
      }),
  },

  offers: {
    mine: () => call<Offer[]>('/api/offers'),

    // NOTE: no company field. The server attaches it from your profile.
    create: (input: {
      listingId: string
      quantityQuintals: number
      offerPrice: number
      message?: string
    }) =>
      call<Offer>('/api/offers', {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    accept: (id: string) =>
      call<Offer>(`/api/offers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      }),

    reject: (id: string) =>
      call<Offer>(`/api/offers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject' }),
      }),

    counter: (id: string, counterPrice: number) =>
      call<Offer>(`/api/offers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'counter', counterPrice }),
      }),

    complete: (
      id: string,
      finalGrade: QualityGrade,
      finalPrice: number,
    ) =>
      call<Offer>(`/api/offers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'complete', finalGrade, finalPrice }),
      }),
  },

  ratings: {
    forFarmer: (farmerId: string) =>
      call<{ ratings: Rating[]; summary: RatingSummary }>(
        `/api/ratings${toQuery({ farmerId })}`,
      ),

    // only offerId — the server derives farmer + buyer and checks the purchase
    create: (input: {
      offerId: string
      stars: number
      comment?: string
    }) =>
      call<Rating>('/api/ratings', {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    remove: (id: string) =>
      call<{ deleted: boolean }>(`/api/ratings${toQuery({ id })}`, {
        method: 'DELETE',
      }),
  },

  mandi: {
    prices: (commodity: string, state = 'Maharashtra') =>
      call<{ records: unknown[] }>(
        `/api/mandi-prices${toQuery({ commodity, state })}`,
      ),
  },

  // -- bucket A -----------------------------------------------------------

  msp: {
    list: (crop?: string) => call<CropMsp[]>(`/api/msp${toQuery({ crop })}`),
  },

  cropCare: {
    list: (crop?: string) =>
      call<CropCareGuideline[]>(`/api/crop-care${toQuery({ crop })}`),
  },

  cropHistory: {
    mine: () => call<FarmerCropHistoryEntry[]>('/api/crop-history'),

    add: (input: {
      cropName: string
      season: string
      quantityQuintals?: number
    }) =>
      call<FarmerCropHistoryEntry>('/api/crop-history', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },

  recommendations: {
    mine: () => call<CropRecommendation[]>('/api/recommendations'),
  },

  weather: {
    forecast: (locationId: string) =>
      call<WeatherSnapshot>(`/api/weather${toQuery({ locationId })}`),
  },
}