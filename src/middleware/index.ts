import { defineMiddleware } from "astro:middleware";
import { isValidRedirectUrl } from "../lib/utils/redirectValidation.ts";
import { createSupabaseServerClientFromCookieHeader } from "../lib/supabase.server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/reset-password", "/about", "/auth/callback", "/auth/confirm", "/auth/recovery"];

// Check if path matches public route (including dynamic segments)
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClientFromCookieHeader(context.request.headers.get("cookie"));
  context.locals.supabase = supabase;

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
        if (import.meta.env.DEV) console.error("Error fetching user profile:", error);
        context.locals.user = null;
      } else {
        context.locals.user = profile;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Unexpected error fetching user profile:", err);
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  const pathname = context.url.pathname;

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
});
