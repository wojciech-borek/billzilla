import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

/**
 * Creates a Supabase browser client for use in React components (client-side)
 * This client handles authentication and session management automatically
 */
export function createClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  return createBrowserClient<Database>(url, key);
}

export type SupabaseClient = ReturnType<typeof createClient>;
export type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
