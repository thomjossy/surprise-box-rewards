-- Enforce one-time code usage per device at database level
-- 1) Deduplicate any existing rows before adding the unique constraint
DELETE FROM public.code_usage a
USING public.code_usage b
WHERE a.code = b.code
  AND a.device_id = b.device_id
  AND a.id > b.id;

-- 2) Add unique constraint (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'code_usage_code_device_key'
      AND conrelid = 'public.code_usage'::regclass
  ) THEN
    ALTER TABLE public.code_usage
    ADD CONSTRAINT code_usage_code_device_key UNIQUE (code, device_id);
  END IF;
END
$$;