
-- Add marketplace fields to public_settings
ALTER TABLE public.public_settings 
ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS category text DEFAULT '';

-- Allow public to view listed shops in marketplace
CREATE POLICY "Public can view listed shops"
ON public.public_settings
FOR SELECT
USING (is_listed = true);
