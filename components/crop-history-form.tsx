'use client'

import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { crops } from '@/lib/crops'
import type { FarmerCropHistoryEntry } from '@/lib/types/db'

const SEASONS = ['Kharif', 'Rabi', 'Zaid'] as const

/**
 * Bucket A #2 — farmer data gathering.
 *
 * Land size + location are already collected at signup (farmer_profiles /
 * profiles). This component is the missing piece: per-season crop history,
 * which the recommendation engine (#3–#5) reads.
 *
 * Crop is free text with a datalist of known crops for convenience — a
 * farmer growing something not in our list can still log it, they're not
 * locked to the dropdown.
 *
 * Drop into the farmer profile / dashboard screen:
 *   <CropHistoryForm />
 */
export function CropHistoryForm() {
  const [history, setHistory] = useState<FarmerCropHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [cropName, setCropName] = useState(crops[0].name)
  const [season, setSeason] = useState<(typeof SEASONS)[number]>('Kharif')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.cropHistory
      .mine()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Datalist = known crop list + whatever this farmer has already typed in
  // themselves, so a custom crop they logged once shows up as a suggestion
  // next time instead of only the fixed 13.
  const knownCropNames = [
    ...crops.map((c) => c.name),
    ...new Set(history.map((h) => h.cropName)),
  ].filter((name, i, arr) => arr.indexOf(name) === i)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!cropName.trim()) {
      setError('Enter a crop name.')
      return
    }

    setSubmitting(true)

    try {
      await api.cropHistory.add({
        cropName: cropName.trim(),
        season,
        quantityQuintals: quantity ? Number(quantity) : undefined,
      })
      setQuantity('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    setDeletingId(id)

    try {
      await api.cropHistory.remove(id)
      setHistory((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-serif text-lg font-bold">Crop history</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Log what you've grown — this drives your rotation and irrigation
        recommendations below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <input
          list="crop-history-known-crops"
          type="text"
          placeholder="Crop name"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          className="min-h-11 rounded-xl border border-border px-3 text-sm"
        />
        <datalist id="crop-history-known-crops">
          {knownCropNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <select
          value={season}
          onChange={(e) => setSeason(e.target.value as (typeof SEASONS)[number])}
          className="min-h-11 rounded-xl border border-border px-3 text-sm"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Quintals (optional)"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="min-h-11 rounded-xl border border-border px-3 text-sm"
        />

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Add'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-5 divide-y divide-border">
        {loading && (
          <li className="py-3 text-sm text-muted-foreground">Loading…</li>
        )}

        {!loading && history.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">
            No crop history logged yet.
          </li>
        )}

        {history.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between py-3 text-sm"
          >
            <span className="font-semibold">
              {entry.cropName} · {entry.season}
            </span>

            <div className="flex items-center gap-3">
              {entry.quantityQuintals !== null && (
                <span className="text-muted-foreground">
                  {entry.quantityQuintals} quintals
                </span>
              )}

              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deletingId === entry.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
