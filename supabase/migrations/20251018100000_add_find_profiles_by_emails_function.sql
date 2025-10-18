-- =============================================
-- Function to find profiles by emails
-- =============================================
-- This function bypasses RLS to allow finding profiles by email
-- when inviting users to a group. It's needed because the RLS policy
-- only allows reading profiles of users in the same group, but during
-- group creation/invitation, the invitees are not yet in the group.

CREATE OR REPLACE FUNCTION public.find_profiles_by_emails(email_list text[])
RETURNS TABLE (
  id uuid,
  email text,
  full_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name
  FROM public.profiles p
  WHERE p.email = ANY(email_list);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_profiles_by_emails(text[]) TO authenticated;

