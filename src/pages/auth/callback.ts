import type { APIRoute } from "astro";
import { isValidRedirectUrl } from "@/lib/utils/redirectValidation";

/**
 * Auth callback endpoint
 * Obsługuje callback z Google OAuth oraz tokeny recovery (reset hasła)
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle OAuth/recovery errors
  if (errorParam) {
    const encodedError = encodeURIComponent(errorDescription || errorParam);
    return redirect(`/login?error=${encodedError}`);
  }

  // Handle OAuth callback - exchange code for session
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

  // Recovery links are now handled by /auth/recovery endpoint

  // Handle email confirmation callback - redirect to confirm page
  const tokenHash = url.searchParams.get("token_hash");
  if (tokenHash && type === "email") {
    return redirect(`/auth/confirm?token_hash=${tokenHash}&type=email&next=${encodeURIComponent(next)}`);
  }

  // No valid parameters provided - redirect to login
  return redirect("/login?error=invalid_callback");
};

export const prerender = false;
