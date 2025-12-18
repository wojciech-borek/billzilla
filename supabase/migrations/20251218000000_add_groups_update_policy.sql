-- Add UPDATE policy for groups table to allow creators to archive groups
-- This allows group creators to update group status (e.g., archive)

CREATE POLICY "allow_update_for_group_creators" ON public.groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id
      AND gm.profile_id = (SELECT auth.uid())
      AND gm.role = 'creator'
      AND gm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id
      AND gm.profile_id = (SELECT auth.uid())
      AND gm.role = 'creator'
      AND gm.status = 'active'
    )
  );
