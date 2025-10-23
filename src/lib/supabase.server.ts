// src/lib/supabase.server.ts
import { createServerClient } from "@supabase/ssr";
import cookie from "cookie";

export function createSupabaseServerClientFromCookieHeader(
  cookieHeader: string | null,
  setCookieCollector?: (hdr: string) => void
) {
  const parsed = cookieHeader ? cookie.parse(cookieHeader) : {};

  const adapter = {
    get(name: string) {
      return parsed[name];
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      const str = cookie.serialize(name, value, options ?? {});
      if (setCookieCollector) setCookieCollector(str);
    },
    remove(name: string, options?: Record<string, unknown>) {
      const str = cookie.serialize(name, "", { ...options, maxAge: 0 });
      if (setCookieCollector) setCookieCollector(str);
    },
  };

  return createServerClient(
    // public URL + anon key — safe to use on server. NEVER expose service_role to client.
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { cookies: adapter }
  );
}
