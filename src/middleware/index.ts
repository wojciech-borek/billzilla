import type { APIContext } from "astro";
import { isValidRedirectUrl } from "../lib/utils/redirectValidation";
import { createSupabaseServerClientFromCookieHeader } from "../db/supabase.server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/about",
  "/auth/callback",
  "/auth/confirm",
  "/auth/recovery",
];

// Check if path matches public route (including dynamic segments)
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export const onRequest = async (context: APIContext, next: () => Promise<Response>) => {
  const pathname = context.url.pathname;

  const supabase = createSupabaseServerClientFromCookieHeader(context.request.headers.get("cookie"));
  context.locals.supabase = supabase;

  // Handle Authorization header for API routes (fallback for CF Pages Functions)
  if (pathname.startsWith("/api/")) {
    const authHeader = context.request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (data.user && !error) {
          // Get profile data
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url")
            .eq("id", data.user.id)
            .single();

          if (!profileError && profile) {
            context.locals.user = profile;
          }
        }
      } catch (_err) {
        // Silently handle Bearer token auth errors
      }
    }
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authUser && !authError) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .eq("id", authUser.id)
        .single();

      if (error) {
        context.locals.user = null;
      } else {
        context.locals.user = profile;
      }
    } catch {
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  if (isPublicRoute(pathname) || pathname.startsWith("/_") || pathname.includes(".")) {
    return next();
  }

  if (!authUser || authError) {
    const redirectPath = pathname + context.url.search;
    const redirectUrl = isValidRedirectUrl(redirectPath)
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : "/login";
    return context.redirect(redirectUrl);
  }

  return next();
};
