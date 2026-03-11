-- Update is_admin() to recognize the new admin email
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT auth.jwt() ->> 'email' IN ('admin@thethankyou.com', 'thompsonjossy99@gmail.com');
$$;