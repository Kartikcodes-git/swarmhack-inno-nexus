import { createBrowserClient } from '@supabase/ssr'

// IMPORTANT: use the @supabase/ssr browser client, not @supabase/supabase-js's
// createClient. The plain client stores the session in localStorage only,
// which the server (lib/supabase/server.ts) and middleware.ts can't read —
// they read the session from cookies. Using createBrowserClient here writes
// the session to cookies too, so server-side auth checks actually see it.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)