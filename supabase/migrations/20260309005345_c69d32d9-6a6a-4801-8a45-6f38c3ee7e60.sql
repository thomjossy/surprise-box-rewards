-- Fix RLS policies for participation_codes to allow admin access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active participation codes" ON participation_codes;

-- Create comprehensive policies that allow admin access and public read for active codes
CREATE POLICY "Public can view active participation codes" 
ON participation_codes FOR SELECT 
USING (is_active = true);

-- Allow authenticated users to insert codes (for admin functionality)
CREATE POLICY "Authenticated users can insert participation codes" 
ON participation_codes FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update codes (for admin functionality)
CREATE POLICY "Authenticated users can update participation codes" 
ON participation_codes FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete codes (for admin functionality)
CREATE POLICY "Authenticated users can delete participation codes" 
ON participation_codes FOR DELETE 
TO authenticated
USING (true);