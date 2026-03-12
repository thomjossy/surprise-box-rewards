-- Allow admin to see ALL notifications (not just enabled ones)
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
CREATE POLICY "Anyone can view enabled notifications" ON public.notifications FOR SELECT TO public USING (enabled = true);
CREATE POLICY "Admin can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (is_admin());
