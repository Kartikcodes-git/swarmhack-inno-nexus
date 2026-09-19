'use client'

import { useEffect } from 'react'

// Registers the PWA service worker. A no-op on the server and on
// browsers without support — safe to mount unconditionally.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('[sw] registration failed', err))
  }, [])

  return null
}
