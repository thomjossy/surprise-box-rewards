
-- Admin can manage notifications
CREATE POLICY "Admin can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update notifications" ON public.notifications
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete notifications" ON public.notifications
FOR DELETE TO authenticated USING (public.is_admin());

-- Admin can manage reward_boxes
CREATE POLICY "Admin can insert reward_boxes" ON public.reward_boxes
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update reward_boxes" ON public.reward_boxes
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete reward_boxes" ON public.reward_boxes
FOR DELETE TO authenticated USING (public.is_admin());

-- Admin can view all participants
CREATE POLICY "Admin can view all participants" ON public.participants
FOR SELECT TO authenticated USING (public.is_admin());

-- Admin can update all participants
CREATE POLICY "Admin can update all participants" ON public.participants
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin can delete participants
CREATE POLICY "Admin can delete participants" ON public.participants
FOR DELETE TO authenticated USING (public.is_admin());

-- Admin can view all participation codes (including inactive)
CREATE POLICY "Admin can view all participation codes" ON public.participation_codes
FOR SELECT TO authenticated USING (public.is_admin());

-- Admin can view all code_usage
CREATE POLICY "Admin can view all code_usage" ON public.code_usage
FOR SELECT TO authenticated USING (public.is_admin());

-- Allow anyone to view enabled notifications (fix: change to permissive)
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
CREATE POLICY "Anyone can view notifications" ON public.notifications
FOR SELECT TO public USING (enabled = true);

-- Allow unauthenticated users to update reward_boxes (when they pick a box)
CREATE POLICY "Anyone can update reward_boxes" ON public.reward_boxes
FOR UPDATE USING (true) WITH CHECK (true);
