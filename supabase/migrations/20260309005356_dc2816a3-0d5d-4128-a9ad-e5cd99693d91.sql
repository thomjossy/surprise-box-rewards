-- Fix overly permissive RLS policies for participation_codes
-- First, let's create an admin check function for security

-- Create admin user check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For now, we'll check against specific admin emails
  -- In a production environment, you'd have a proper roles table
  SELECT auth.jwt() ->> 'email' IN ('admin@thethankyou.com');
$$;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert participation codes" ON participation_codes;
DROP POLICY IF EXISTS "Authenticated users can update participation codes" ON participation_codes;
DROP POLICY IF EXISTS "Authenticated users can delete participation codes" ON participation_codes;

-- Create restrictive admin-only policies
CREATE POLICY "Admin can insert participation codes" 
ON participation_codes FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update participation codes" 
ON participation_codes FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete participation codes" 
ON participation_codes FOR DELETE 
TO authenticated
USING (is_admin());