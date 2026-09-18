'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language'
import { api } from '@/lib/api-client'
import { compareToMsp } from '@/lib/recommendations'
import type { CropMsp } from '@/lib/types/db'

/**
 * Bucket A #1 — MSP badge.
 *
 * Drop into any listing card:
 *   <MspBadge cropName={listing.cropName} season="Kharif" pricePerQuintal={listing.pricePerQuintal} />
 *
 * Fetches /api/msp for the crop, compares against the listing price, and
 * renders using the mspBenchmark / aboveMsp / belowMsp / mspNotApplicable
 * strings already translated in lib/language.tsx.
 */
export function MspBadge({
  cropName,
  season,
  pricePerQuintal,
}: {
  cropName: string
  season: string
  pricePerQuintal: number
}) {
  const { t } = useLanguage()
  const [msps, setMsps] = useState<CropMsp[] | null>(null)

  useEffect(() => {
    let cancelled = false

    api.msp
      .list(cropName)
      .then((data) => {
        if (!cancelled) setMsps(data)
      })
      .catch(() => {
        if (!cancelled) setMsps([])
      })

    return () => {
      cancelled = true
    }
  }, [cropName])

  if (msps === null) {
    return null // loading — render nothing rather than flash a wrong state
  }

  const comparison = compareToMsp(cropName, season, pricePerQuintal, msps)

  if (comparison.status === 'unavailable') {
    return (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {t.mspNotApplicable}
      </span>
    )
  }

  const isAbove = comparison.status === 'above'

  return (
    <span
      title={`${t.governmentMsp}: ₹${comparison.msp!.mspPerQuintal.toLocaleString('en-IN')}/q`}
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        isAbove
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {isAbove ? t.aboveMsp : t.belowMsp}
    </span>
  )
}
