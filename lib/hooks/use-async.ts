'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api-client'

/**
 * Requirement #14.
 *
 * Every remote read goes through useAsync, so no screen has to invent its
 * own loading flag. `isEmpty` is computed here rather than left to each
 * component, which is how empty states end up missing on half the screens.
 */

export type AsyncState<T> = {
  data: T | null
  isLoading: boolean
  error: string | null
  fieldErrors: Record<string, string> | null
  isEmpty: boolean
  reload: () => void
}

export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string> | null>(null)
  const [nonce, setNonce] = useState(0)

  // guards against a slow first request overwriting a fast second one
  const requestId = useRef(0)

  useEffect(() => {
    const id = ++requestId.current
    let cancelled = false

    setIsLoading(true)
    setError(null)
    setFieldErrors(null)

    fetcher()
      .then((result) => {
        if (cancelled || id !== requestId.current) return
        setData(result)
      })
      .catch((caught: unknown) => {
        if (cancelled || id !== requestId.current) return

        if (caught instanceof ApiError) {
          setError(caught.message)
          setFieldErrors(caught.fieldErrors ?? null)
        } else {
          setError('Something went wrong. Please try again.')
        }
      })
      .finally(() => {
        if (cancelled || id !== requestId.current) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  const isEmpty =
    !isLoading &&
    !error &&
    (data == null || (Array.isArray(data) && data.length === 0))

  return { data, isLoading, error, fieldErrors, isEmpty, reload }
}

/**
 * For writes (submit offer, post rating). Exposes per-field errors so the
 * form can highlight exactly what the server rejected.
 */
export function useMutation<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string> | null>(null)

  const run = useCallback(
    async (input: TInput): Promise<TResult | null> => {
      setIsSubmitting(true)
      setError(null)
      setFieldErrors(null)

      try {
        return await action(input)
      } catch (caught) {
        if (caught instanceof ApiError) {
          setError(caught.message)
          setFieldErrors(caught.fieldErrors ?? null)
        } else {
          setError('Something went wrong. Please try again.')
        }
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [action],
  )

  const reset = useCallback(() => {
    setError(null)
    setFieldErrors(null)
  }, [])

  return { run, isSubmitting, error, fieldErrors, reset }
}