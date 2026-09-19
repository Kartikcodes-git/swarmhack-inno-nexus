'use client'

import { RecommendationsFeed } from '@/components/recommendations-feed'
import { CropHistoryForm } from '@/components/crop-history-form'

/**
 * Crop log, as its own screen (not on the dashboard). Bucket A #2–#5:
 * log what you grew, get rotation/irrigation/pesticide recommendations
 * back. MSP is excluded here — it has its own page (components/msp-page.tsx).
 */
export function CropLogPage({ back }: { back: () => void }) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={back}
        className="text-sm font-semibold text-primary"
      >
        ← Back to dashboard
      </button>

      <div>
        <p className="text-sm font-semibold text-primary">Crop log</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">
          What you've grown, and what to do next
        </h1>
        <p className="mt-2 text-muted-foreground">
          Log your crops here — it drives the rotation, irrigation and
          pesticide recommendations below.
        </p>
      </div>

      <RecommendationsFeed excludeKinds={['msp']} />
      <CropHistoryForm />
    </div>
  )
}
