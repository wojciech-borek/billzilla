import type { APIRoute } from "astro";

/**
 * Recovery endpoint for password reset
 * Handles recovery tokens from email links and redirects to reset password page
 */
export const GET: APIRoute = async ({ url, redirect, locals }) => {
  const tokenHash = url.searchParams.get("token_hash");
  const token = url.searchParams.get("token");
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");
  const errorParam = url.searchParams.get("error");

  // Handle errors
  if (errorParam) {
    const errorDescription = url.searchParams.get("error_description") || errorParam;
    return redirect(`/reset-password?error=${encodeURIComponent(errorDescription)}`);
  }

  // Handle OAuth code from Supabase recovery flow
  if (code) {
    const supabase = locals.supabase;
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      return redirect(`/reset-password?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=recovery`);
    } else {
      return redirect('/reset-password?error=no_session');
    }
  }

  // Handle recovery with session tokens
  if (accessToken && refreshToken) {
    return redirect(`/reset-password?access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`);
  }

  // Handle recovery with tokens
  const recoveryToken = tokenHash || token;
  if (recoveryToken && type === "recovery") {
    const paramName = tokenHash ? 'token_hash' : 'token';
    return redirect(`/reset-password?${paramName}=${recoveryToken}&type=recovery`);
  }

  // No valid parameters
  return redirect('/reset-password?error=invalid_recovery_link');
};

export const prerender = false;
