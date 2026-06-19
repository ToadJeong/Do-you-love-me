import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Uses the public URL + anon key, which are safe to expose to the
 * client because every table is protected by Row Level Security.
 * Use this inside Client Components ("use client").
 *
 * For Server Components / Route Handlers / Server Actions, create a
 * separate server client (cookie-aware) instead of importing this.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local (see .env.local.example).",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
