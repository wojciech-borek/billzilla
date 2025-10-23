import type { APIRoute } from "astro";
import { isValidRedirectUrl } from "@/lib/utils/redirectValidation";

/**
 * OAuth callback endpoint
 * Obsługuje callback z Google OAuth i exchange code za session
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle OAuth errors
  if (errorParam) {
    const encodedError = encodeURIComponent(errorDescription || errorParam);
    return redirect(`/login?error=${encodedError}`);
  }

  // Exchange code for session
  if (code) {
    const supabase = locals.supabase;
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    // Successful authentication - validate and redirect to next page
    // BEZPIECZEŃSTWO: Walidacja redirect URL przed użyciem
    const safeNext = isValidRedirectUrl(next) ? next : "/";
    return redirect(safeNext);
  }

  // No code provided - redirect to login
  return redirect("/login?error=missing_code");
};

export const prerender = false;
