import type {
  Market,
  MarketDemand,
  PriceTrend,
} from './markets'
import {
  calculateRevenue,
  type RevenueResult,
} from './revenue'

export type RecommendationLabel =
  | 'BEST MARKET'
  | 'GOOD OPTION'
  | 'LOWER RETURN'

export type MarketRecommendation = {
  market: Market
  revenue: RevenueResult
  score: number
  label: RecommendationLabel
  explanation: string
}

function demandScore(
  demand: MarketDemand,
): number {
  switch (demand) {
    case 'HIGH':
      return 10
    case 'MEDIUM':
      return 5
    case 'LOW':
      return 0
  }
}

function trendScore(
  trend: PriceTrend,
): number {
  switch (trend) {
    case 'Increasing':
      return 10
    case 'Stable':
      return 5
    case 'Decreasing':
      return 0
  }
}

/**
 * Calculates a recommendation score.
 *
 * Net revenue is intentionally the dominant factor.
 * Demand and price trend are supporting signals and
 * should not override a meaningful revenue advantage.
 */
export function getMarketRecommendations(
  markets: Market[],
  cropName: string,
  quantityInQuintals: number,
): MarketRecommendation[] {
  const revenueResults = markets.map(
    (market) => ({
      market,
      revenue: calculateRevenue(
        market,
        cropName,
        quantityInQuintals,
      ),
    }),
  )

  const netRevenues =
    revenueResults.map(
      ({ revenue }) =>
        revenue.netRevenue,
    )

  const highestNetRevenue =
    Math.max(...netRevenues, 0)

  const lowestNetRevenue =
    Math.min(...netRevenues, 0)

  const revenueRange =
    highestNetRevenue -
    lowestNetRevenue

  const recommendations =
    revenueResults.map(
      ({ market, revenue }) => {
        const revenueScore =
          revenueRange > 0
            ? ((revenue.netRevenue -
                lowestNetRevenue) /
                revenueRange) *
              80
            : 80

        const supportingScore =
          demandScore(market.demand) +
          trendScore(market.priceTrend)

        const score =
          Math.round(
            revenueScore +
              supportingScore,
          )

        return {
          market,
          revenue,
          score,
          label:
            'LOWER RETURN' as RecommendationLabel,
          explanation: '',
        }
      },
    )

  recommendations.sort(
    (a, b) =>
      b.revenue.netRevenue -
      a.revenue.netRevenue,
  )

  return recommendations.map(
    (recommendation, index) => {
      const isBest = index === 0

      const label: RecommendationLabel =
        isBest
          ? 'BEST MARKET'
          : recommendation.revenue.netRevenue >=
              highestNetRevenue * 0.95
            ? 'GOOD OPTION'
            : 'LOWER RETURN'

      const demandText =
        recommendation.market.demand ===
        'HIGH'
          ? 'high demand'
          : recommendation.market.demand ===
              'MEDIUM'
            ? 'moderate demand'
            : 'low demand'

      const trendText =
        recommendation.market.priceTrend ===
        'Increasing'
          ? 'an increasing price trend'
          : recommendation.market.priceTrend ===
              'Stable'
            ? 'a stable price trend'
            : 'a decreasing price trend'

      const explanation = isBest
        ? `${recommendation.market.name} gives the highest estimated net return after transport and handling costs. It also has ${demandText} and ${trendText}.`
        : `${recommendation.market.name} has an estimated net return of ₹${recommendation.revenue.netRevenue.toLocaleString('en-IN')}. It has ${demandText} and ${trendText}.`

      return {
        ...recommendation,
        label,
        explanation,
      }
    },
  )
}

export function getBestMarketRecommendation(
  markets: Market[],
  cropName: string,
  quantityInQuintals: number,
): MarketRecommendation | null {
  const recommendations =
    getMarketRecommendations(
      markets,
      cropName,
      quantityInQuintals,
    )

  return recommendations[0] ?? null
}
