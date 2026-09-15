/**
 * Database types — mirror of supabase/schema.sql.
 *
 * These are the only shapes the frontend should know about. If you swap
 * Supabase for Firebase or a custom API later, this file and lib/db/*
 * change; nothing in components/ or app/page.tsx has to.
 */

export type UserRole = 'farmer' | 'buyer'
export type QualityGrade = 'A' | 'B' | 'C'
export type ListingStatus = 'active' | 'sold' | 'withdrawn'
export type OfferStatus =
  | 'pending'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'completed'
export type CropCategory =
  | 'Vegetable'
  | 'Grain'
  | 'Pulse'
  | 'Cash Crop'
  | 'Fruit'

export type Profile = {
  id: string
  role: UserRole
  fullName: string
  phone: string
  locationId: string | null
  createdAt: string
}

export type FarmerProfile = Profile & {
  role: 'farmer'
  farmerIdUrl: string | null
  farmerIdVerified: boolean
}

export type BuyerProfile = Profile & {
  role: 'buyer'
  companyName: string
  businessType: string | null
  gstin: string | null
  businessAddress: string | null
}

export type AnyProfile = FarmerProfile | BuyerProfile

export type Listing = {
  id: string
  farmerId: string
  farmerName: string
  cropName: string
  cropCategory: CropCategory
  quantityQuintals: number
  pricePerQuintal: number
  locationId: string
  grade: QualityGrade
  status: ListingStatus
  createdAt: string
  /** joined from farmer_rating_summary */
  farmerRating: { average: number; count: number }
}

export type Offer = {
  id: string
  listingId: string
  buyerId: string
  farmerId: string
  /** resolved server-side from the buyer's profile — never client input */
  buyerCompany: string
  quantityQuintals: number
  offerPrice: number
  counterPrice: number | null
  message: string | null
  status: OfferStatus
  finalGrade: QualityGrade | null
  finalPrice: number | null
  completedAt: string | null
  createdAt: string
}

export type Rating = {
  id: string
  offerId: string
  farmerId: string
  buyerId: string
  stars: number
  comment: string | null
  createdAt: string
}

export type RatingSummary = {
  farmerId: string
  average: number
  count: number
}

export type ListingFilters = {
  crop?: string
  category?: CropCategory
  locationId?: string
  grade?: QualityGrade
  minPrice?: number
  maxPrice?: number
}

/** Uniform API envelope so the frontend can handle every route the same way. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }