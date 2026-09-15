export type FarmerRating = {
  id: string
  farmer: string
  /** business name of the buyer who left the rating */
  buyer: string
  /** 1–5 */
  stars: number
  comment?: string
  date: string
}

export type RatingSummary = {
  farmer: string
  average: number
  count: number
}

/**
 * Seed ratings so the prototype isn't empty on first load.
 * Each one corresponds to a completed (accepted) purchase.
 */
export const seedRatings: FarmerRating[] = [
  {
    id: 'r1',
    farmer: 'Ramesh Patil',
    buyer: 'ABC Foods',
    stars: 5,
    comment: 'Produce matched the listed grade. Clean sorting.',
    date: '2 Sept 2026',
  },
  {
    id: 'r2',
    farmer: 'Ramesh Patil',
    buyer: 'FreshMart',
    stars: 4,
    comment: 'Good quality, pickup was slightly delayed.',
    date: '28 Aug 2026',
  },
  {
    id: 'r3',
    farmer: 'Meena Shinde',
    buyer: 'AgroTrade',
    stars: 4,
    date: '30 Aug 2026',
  },
  {
    id: 'r4',
    farmer: 'Vilas Pawar',
    buyer: 'ABC Foods',
    stars: 3,
    comment: 'Grade was lower than listed for part of the lot.',
    date: '26 Aug 2026',
  },
]

export function getRatingSummary(
  ratings: FarmerRating[],
  farmer: string,
): RatingSummary {
  const forFarmer = ratings.filter(
    (rating) => rating.farmer === farmer,
  )

  if (forFarmer.length === 0) {
    return { farmer, average: 0, count: 0 }
  }

  const total = forFarmer.reduce(
    (sum, rating) => sum + rating.stars,
    0,
  )

  return {
    farmer,
    average:
      Math.round((total / forFarmer.length) * 10) / 10,
    count: forFarmer.length,
  }
}

/**
 * A buyer may rate a farmer ONLY if they have an accepted
 * (i.e. actually completed) purchase from that farmer.
 * This is the gate the UI must respect — not a display hint.
 */
export function canBuyerRateFarmer(
  purchases: Array<{
    buyer: string
    farmer: string
    status: string
  }>,
  buyer: string,
  farmer: string,
): boolean {
  if (!buyer || !farmer) {
    return false
  }

  return purchases.some(
    (purchase) =>
      purchase.buyer === buyer &&
      purchase.farmer === farmer &&
      purchase.status === 'Accepted',
  )
}

export function hasBuyerAlreadyRated(
  ratings: FarmerRating[],
  buyer: string,
  farmer: string,
): boolean {
  return ratings.some(
    (rating) =>
      rating.buyer === buyer && rating.farmer === farmer,
  )
}

export function addRating(
  ratings: FarmerRating[],
  rating: Omit<FarmerRating, 'id' | 'date'>,
): FarmerRating[] {
  const entry: FarmerRating = {
    ...rating,
    id: `rating-${Date.now()}`,
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }

  // one rating per buyer per farmer — replace any earlier one
  const others = ratings.filter(
    (existing) =>
      !(
        existing.buyer === entry.buyer &&
        existing.farmer === entry.farmer
      ),
  )

  return [...others, entry]
}