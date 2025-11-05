/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";
import type { AuthUserWithProfile } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: AuthUserWithProfile | null;
      runtime?: {
        env?: Record<string, string | undefined>;
      };
    }
  }
}
