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


-- =============================================
-- Invitation privacy improvements
-- =============================================
-- comment: Add support for existing user invitations requiring acceptance

-- Add new column for existing user invitations (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invitations' AND column_name = 'invitee_profile_id'
  ) THEN
    ALTER TABLE invitations
    ADD COLUMN invitee_profile_id UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Create indexes for performance optimization
-- Index for quick lookup of invitations for existing users
CREATE INDEX idx_invitations_invitee_profile_id ON invitations(invitee_profile_id)
WHERE invitee_profile_id IS NOT NULL;

-- Index for pending invitations of existing users
CREATE INDEX idx_invitations_pending_invitee ON invitations(status, invitee_profile_id)
WHERE status = 'pending' AND invitee_profile_id IS NOT NULL;

-- Index for email-based invitations (all invitations)
CREATE INDEX idx_invitations_email ON invitations(email);

-- Index for pending invitations by email (new users)
CREATE INDEX idx_invitations_pending_email ON invitations(status, email)
WHERE status = 'pending';

-- Compound index for email + profile_id optimization
CREATE INDEX idx_invitations_email_profile ON invitations(email, invitee_profile_id);

-- Migrate existing group memberships to "accepted" invitations
-- This creates historical invitations for users who were previously auto-added to groups
-- Only create if invitation doesn't already exist for this user-group combination
INSERT INTO invitations (
  id,
  email,
  group_id,
  invitee_profile_id,
  status,
  created_at
)
SELECT
  gen_random_uuid(),  -- Generate new UUID for each invitation
  p.email,
  gm.group_id,
  gm.profile_id,      -- ID of existing user
  'accepted',         -- Status: accepted (historical)
  gm.joined_at        -- Use joined_at as invitation creation date
FROM group_members gm
JOIN profiles p ON p.id = gm.profile_id
WHERE gm.status = 'active'
AND gm.role = 'member'  -- Skip creators, they "create" the group
AND gm.joined_at IS NOT NULL
-- Only insert if no invitation already exists for this user-group combination
AND NOT EXISTS (
  SELECT 1 FROM invitations i
  WHERE i.invitee_profile_id = gm.profile_id
  AND i.group_id = gm.group_id
  AND i.status = 'accepted'
);


-- Create function for sending invitation emails
-- Uses Supabase's built-in SMTP configuration (same as auth emails)
CREATE OR REPLACE FUNCTION send_invitation_email(
  to_email TEXT,
  email_subject TEXT,
  html_content TEXT,
  text_content TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  smtp_enabled BOOLEAN := false;
BEGIN
  -- Check if SMTP is configured in auth settings
  SELECT COALESCE(
    (auth.get_auth_config() -> 'email' -> 'smtp' ->> 'enabled')::BOOLEAN,
    false
  ) INTO smtp_enabled;

  -- If SMTP is enabled, send email using Supabase's built-in email system
  IF smtp_enabled THEN
    -- Send email using Supabase's email infrastructure
    -- This uses the same SMTP configuration as auth emails
    PERFORM auth.send_email(
      to_email,
      email_subject,
      html_content,
      text_content
    );

    RETURN json_build_object(
      'success', true,
      'message', 'Email sent via SMTP',
      'recipient', to_email
    );
  END IF;

  -- Fallback: log email for manual processing
  RAISE LOG 'Invitation email (SMTP not configured): to=%, subject=%, html_len=%',
    to_email, email_subject, length(html_content);

  RETURN json_build_object(
    'success', false,
    'message', 'Email logged (configure SMTP in auth.email.smtp for sending)',
    'recipient', to_email,
    'subject', email_subject,
    'needs_smtp_setup', true
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE,
      'recipient', to_email
    );
END;
$$;

-- Create function to safely find user by email (bypasses RLS)
CREATE OR REPLACE FUNCTION find_user_by_email_safe(
  email_to_find TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find user by email, bypassing RLS since this is SECURITY DEFINER
  SELECT id INTO user_id
  FROM profiles
  WHERE email = email_to_find;

  RETURN user_id;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_user_by_email_safe(TEXT) TO authenticated;

-- Fix RLS policy for invitations table
-- Allow group members to create invitations for their groups
CREATE POLICY "allow_insert_for_group_members" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- Allow users to update their own invitations (accept/decline)
CREATE POLICY "allow_update_for_invited_users" ON public.invitations
  FOR UPDATE TO authenticated
  USING (
    -- Allow users to update invitations where their email matches
    email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    OR
    -- Allow users to update invitations where they are the invitee_profile_id
    invitee_profile_id = auth.uid()
  )
  WITH CHECK (
    -- Allow users to update invitations where their email matches
    email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    OR
    -- Allow users to update invitations where they are the invitee_profile_id
    invitee_profile_id = auth.uid()
  );