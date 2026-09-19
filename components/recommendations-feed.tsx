'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import type { CropRecommendation, RecommendationKind } from '@/lib/types/db'

const KIND_STYLE: Record<
  RecommendationKind,
  { label: string; icon: string; tone: string }
> = {
  msp: { label: 'MSP alert', icon: '💰', tone: 'bg-emerald-100 text-emerald-800' },
  rotation: { label: 'Crop rotation', icon: '🔄', tone: 'bg-amber-100 text-amber-900' },
  irrigation: { label: 'Irrigation', icon: '💧', tone: 'bg-sky-100 text-sky-800' },
  pesticide: { label: 'Pesticide', icon: '🐛', tone: 'bg-red-100 text-red-800' },
}

/**
 * Bucket A #3, #4, #5 — the pushed recommendation feed.
 *
 * Pulls /api/recommendations (crop history × MSP × crop-care guidelines,
 * already joined and ranked server-side) and renders it as cards. Empty
 * automatically for a farmer with no crop history logged yet — point them
 * at <CropHistoryForm /> first.
 *
 * Drop into the farmer dashboard:
 *   <RecommendationsFeed />
 */
export function RecommendationsFeed({
  excludeKinds = [],
}: {
  excludeKinds?: RecommendationKind[]
} = {}) {
  const [items, setItems] = useState<CropRecommendation[] | null>(null)

  useEffect(() => {
    let cancelled = false

    api.recommendations
      .mine()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (items === null) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Loading recommendations…
      </div>
    )
  }

  const visibleItems = items.filter(
    (item) => !excludeKinds.includes(item.kind),
  )

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Log a crop in your crop history to get rotation and irrigation
        recommendations here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleItems.map((item, i) => {
        const style = KIND_STYLE[item.kind]

        return (
          <div
            key={`${item.cropName}-${item.kind}-${i}`}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.tone}`}
              >
                {style.icon} {style.label}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {item.cropName}
              </span>
            </div>

            <p className="mt-2 text-sm">{item.message}</p>
          </div>
        )
      })}
    </div>
  )
}
