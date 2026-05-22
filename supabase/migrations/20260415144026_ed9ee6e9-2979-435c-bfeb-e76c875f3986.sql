
-- Set existing public stores to listed
UPDATE public.public_settings SET is_listed = true WHERE is_public_enabled = true;

-- Change default so new shops are auto-listed
ALTER TABLE public.public_settings ALTER COLUMN is_listed SET DEFAULT true;
