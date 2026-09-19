'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { crops } from '@/lib/crops'
import type { CropMsp } from '@/lib/types/db'

/**
 * Bucket A #1 — full MSP directory, as its own screen (not buried in the
 * dashboard feed). Pulls every crop_msp row from /api/msp (public, no
 * crop filter) so a farmer can check any crop's government MSP, not just
 * the ones in their own crop history.
 */
export function MspPage({ back }: { back: () => void }) {
  const [records, setRecords] = useState<CropMsp[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    api.msp
      .list()
      .then((data) => {
        if (!cancelled) setRecords(data)
      })
      .catch(() => {
        if (!cancelled) setRecords([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered =
    records?.filter((r) =>
      r.cropName.toLowerCase().includes(query.trim().toLowerCase()),
    ) ?? []

  const mspCropNames = new Set(records?.map((r) => r.cropName) ?? [])
  const noMspCrops = crops.filter((c) => !mspCropNames.has(c.name))

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
        <p className="text-sm font-semibold text-primary">
          Minimum Support Price
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold">
          Government MSP, by crop
        </h1>
        <p className="mt-2 text-muted-foreground">
          List at or above MSP to avoid distress selling. Updated by the
          government each season.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search crop…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-11 w-full max-w-sm rounded-xl border border-border px-4 text-sm sm:w-80"
      />

      {records === null && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Loading MSP data…
        </div>
      )}

      {records !== null && filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No MSP data found{query ? ` for "${query}"` : ''}.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3">Season</th>
                <th className="px-4 py-3">MSP / quintal</th>
                <th className="px-4 py-3">Effective from</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">{r.cropName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.season}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-700">
                    ₹{r.mspPerQuintal.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.effectiveFrom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {records !== null && noMspCrops.length > 0 && !query && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            No MSP for: {noMspCrops.map((c) => `${c.icon} ${c.name}`).join(', ')}
          </p>
          <p className="mt-1">
            Not missing data — the government only sets MSP for select
            grains, pulses, oilseeds and cotton. Perishable fruits aren't
            MSP-notified crops in India, so there's no official price floor
            to show here.
          </p>
        </div>
      )}
    </div>
  )
}
