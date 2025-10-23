/**
 * Validates that a redirect URL is safe (internal to the application)
 * Prevents Open Redirect vulnerability by rejecting external URLs
 *
 * @param url - The redirect URL to validate
 * @returns true if URL is a valid internal path, false otherwise
 *
 * @example
 * isValidRedirectUrl('/groups/123')        // ✅ true - valid internal path
 * isValidRedirectUrl('/groups/123?tab=1')  // ✅ true - with query params
 * isValidRedirectUrl('https://evil.com')   // ❌ false - external URL
 * isValidRedirectUrl('//evil.com')         // ❌ false - protocol-relative
 * isValidRedirectUrl('javascript:alert(1)') // ❌ false - javascript: protocol
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  // Null/undefined/empty check
  if (!url) return false;

  // Must start with / (internal path)
  if (!url.startsWith("/")) return false;

  // Cannot start with // (protocol-relative URL)
  if (url.startsWith("//")) return false;

  // Cannot contain :// (absolute URL with protocol)
  if (url.includes("://")) return false;

  return true;
}
