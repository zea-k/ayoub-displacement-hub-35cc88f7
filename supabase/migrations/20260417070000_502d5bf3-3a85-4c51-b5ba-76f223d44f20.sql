-- Add category_id and featured support for marketplace shops
ALTER TABLE public.public_settings
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_public_settings_category_id ON public.public_settings(category_id);
CREATE INDEX IF NOT EXISTS idx_public_settings_is_featured ON public.public_settings(is_featured);
