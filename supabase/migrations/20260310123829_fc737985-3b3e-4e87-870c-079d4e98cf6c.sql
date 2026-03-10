
-- Replace the permissive update policy with a more restrictive one
-- Only allow updating is_opened and opened_by fields (box selection by players)
DROP POLICY IF EXISTS "Anyone can update reward_boxes" ON public.reward_boxes;

-- Allow authenticated and anon users to update only unopened boxes
CREATE POLICY "Players can open reward_boxes" ON public.reward_boxes
FOR UPDATE USING (is_opened = false) WITH CHECK (is_opened = true);
