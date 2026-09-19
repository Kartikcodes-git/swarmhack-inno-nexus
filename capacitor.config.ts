import type { CapacitorConfig } from '@capacitor/cli'

// IMPORTANT: this app has server-side API routes (Supabase auth via
// cookies, /api/profile, /api/offers, etc). Those need a real Next.js
// server running — a static-export APK can't serve them. So the
// Android app is a "hybrid" shell: it opens your deployed URL inside
// a native WebView, giving you an installable app icon + native
// splash/status-bar while the real app keeps running on your server.
//
// Replace this with your deployed URL (Vercel, etc.) before building.
// For local testing on a phone on the same Wi-Fi, use your machine's
// LAN IP instead of localhost, e.g. "http://192.168.1.20:3000".
const DEPLOYED_URL = 'https://your-krishisetu-deployment.vercel.app'

const config: CapacitorConfig = {
  appId: 'in.krishisetu.app',
  appName: 'KrishiSetu',
  webDir: 'public', // unused in server mode, required by the CLI
  server: {
    url: DEPLOYED_URL,
    cleartext: true, // allow http:// for local LAN testing; drop for a real https deploy
  },
  android: {
    allowMixedContent: true,
  },
}

export default config
