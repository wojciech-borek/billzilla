-- =============================================
-- Accept invitation transaction function and updated group_members policies
-- =============================================
-- comment: Adds the missing accept_invitation_transaction function and proper RLS policies for group member management

-- =============================================
-- Accept invitation transaction function
-- =============================================
-- comment: Atomic function to accept pending invitations and add user to group
-- This function handles the complete invitation acceptance process including
-- updating invitation status and adding the user as a member

CREATE OR REPLACE FUNCTION public.accept_invitation_transaction(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  invitation_id UUID,
  group_id UUID,
  group_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Security checks for SECURITY DEFINER function
  -- Verify that JWT is present (user is authenticated)
  IF auth.jwt() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: JWT token not found';
  END IF;

  -- Verify that the caller is authenticated and matches the user_id
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User not authenticated';
  END IF;

  -- Verify that the caller is the same as p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot accept invitation for another user (auth.uid=%, p_user_id=%)', auth.uid(), p_user_id;
  END IF;

  -- Get and validate the invitation
  SELECT i.id, i.email, i.status, i.group_id as invitation_group_id, g.name as group_name
  INTO v_invitation
  FROM public.invitations i
  JOIN public.groups g ON i.group_id = g.id
  WHERE i.id = p_invitation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Verify invitation belongs to the user
  IF v_invitation.email != (SELECT email FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invitation does not belong to this user';
  END IF;

  -- Check if invitation is still pending
  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending (current status: %)', v_invitation.status;
  END IF;

  -- Check if user is already a member of the group
  IF EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = v_invitation.invitation_group_id AND gm.profile_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this group';
  END IF;

  -- Update invitation status to accepted
  UPDATE public.invitations
  SET status = 'accepted'::public.invitation_status
  WHERE id = p_invitation_id;

  -- Add user as member to the group
  INSERT INTO public.group_members (group_id, profile_id, role, status)
  VALUES (v_invitation.invitation_group_id, p_user_id, 'member', 'active');

  -- Return the result
  RETURN QUERY
  SELECT
    p_invitation_id,
    v_invitation.invitation_group_id,
    v_invitation.group_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_invitation_transaction(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.accept_invitation_transaction IS
  'Accepts a pending invitation and adds the user to the group atomically. Runs as SECURITY DEFINER (bypasses RLS, validates auth internally).';


-- =============================================
-- Updated RLS policies for group_members
-- =============================================
-- comment: Add UPDATE and DELETE policies for group member management

-- Policy: Group creators can update member roles and status (but not their own)
create policy "allow_update_for_group_creators" on public.group_members for update
  to authenticated
  using (
    -- Allow group creators to manage members
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id
      and gm.profile_id = (select auth.uid())
      and gm.role = 'creator'
    )
  )
  with check (
    -- Allow group creators to manage members
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id
      and gm.profile_id = (select auth.uid())
      and gm.role = 'creator'
    )
  );

-- Policy: Group creators can remove members (but not themselves)
create policy "allow_delete_for_group_creators" on public.group_members for delete
  to authenticated
  using (
    -- Allow group creators to remove members (but not themselves)
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id
      and gm.profile_id = (select auth.uid())
      and gm.role = 'creator'
      and profile_id != (select auth.uid())  -- Cannot delete themselves
    )
  );
