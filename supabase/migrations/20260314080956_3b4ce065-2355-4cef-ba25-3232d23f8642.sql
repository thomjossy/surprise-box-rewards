-- Add columns for KYC file URLs
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS id_file_url text,
ADD COLUMN IF NOT EXISTS selfie_file_url text,
ADD COLUMN IF NOT EXISTS password_hash text;

-- Create storage bucket for KYC files
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-files', 'kyc-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Allow anonymous uploads to kyc-files bucket
CREATE POLICY "Anyone can upload kyc files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'kyc-files');

-- RLS: Admin can view kyc files
CREATE POLICY "Admin can view kyc files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc-files' AND public.is_admin());