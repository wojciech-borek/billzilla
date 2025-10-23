-- Migration: Create group transaction function
-- This function creates a group with all related data atomically
-- It uses SECURITY DEFINER to bypass RLS and perform its own auth checks
-- This provides both security and atomicity

CREATE OR REPLACE FUNCTION public.create_group_transaction(
  p_group_name TEXT,
  p_base_currency_code VARCHAR(3),
  p_creator_id UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  name TEXT,
  base_currency_code VARCHAR(3),
  status public.group_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Security checks for SECURITY DEFINER function
  -- Verify that JWT is present (user is authenticated)
  IF auth.jwt() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: JWT token not found';
  END IF;

  -- Verify that the caller is authenticated and matches the creator_id
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User not authenticated';
  END IF;

  -- Verify that the caller is the same as p_creator_id
  IF auth.uid() != p_creator_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot create group for another user (auth.uid=%, p_creator_id=%)', auth.uid(), p_creator_id;
  END IF;

  -- Debug: Log successful auth validation
  RAISE NOTICE 'Auth validation passed: auth.uid() = %, p_creator_id = %', auth.uid(), p_creator_id;

  -- Verify that the currency exists
  IF NOT EXISTS (SELECT 1 FROM public.currencies WHERE code = p_base_currency_code) THEN
    RAISE EXCEPTION 'Currency % does not exist', p_base_currency_code;
  END IF;

  -- Debug: Log before INSERT
  RAISE NOTICE 'About to INSERT into groups table';
  
  -- Insert the group (RLS policy applies)
  INSERT INTO public.groups (name, base_currency_code, status)
  VALUES (p_group_name, p_base_currency_code, 'active')
  RETURNING groups.id, groups.created_at
  INTO v_group_id, v_created_at;
  
  RAISE NOTICE 'Successfully inserted group with id = %', v_group_id;

  -- Add creator as a member (RLS policy applies)
  INSERT INTO public.group_members (group_id, profile_id, role, status)
  VALUES (v_group_id, p_creator_id, 'creator', 'active');

  -- Add base currency with exchange rate 1.0 (RLS policy applies)
  INSERT INTO public.group_currencies (group_id, currency_code, exchange_rate)
  VALUES (v_group_id, p_base_currency_code, 1.0);

  -- Return the created group
  RETURN QUERY
  SELECT 
    v_group_id,
    v_created_at,
    p_group_name,
    p_base_currency_code,
    'active'::public.group_status;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_group_transaction(TEXT, VARCHAR(3), UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_group_transaction IS
  'Creates a new group with the specified creator as the first member. Runs as SECURITY DEFINER (bypasses RLS, validates auth internally).';

-- Fix RLS policies for group_members and group_currencies during group creation
-- The issue is that is_group_member() returns false when creating a new group
-- because the creator isn't in the group yet

-- Security policies for normal operations (not used by create_group_transaction)
-- Since create_group_transaction uses SECURITY DEFINER, these policies protect other operations
DROP POLICY IF EXISTS "allow_read_own_groups" ON public.groups;
CREATE POLICY "allow_read_own_groups" ON public.groups FOR SELECT
  TO authenticated
  USING (is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "allow_read_for_group_members" ON public.group_members;
CREATE POLICY "allow_read_for_group_members" ON public.group_members FOR SELECT
  TO authenticated
  USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "allow_all_for_group_members" ON public.group_currencies;
CREATE POLICY "allow_all_for_group_members" ON public.group_currencies FOR ALL
  TO authenticated
  USING (is_group_member(group_id, auth.uid()))
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- RE-ENABLE RLS WITH PROPER POLICIES
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_currencies ENABLE ROW LEVEL SECURITY;

