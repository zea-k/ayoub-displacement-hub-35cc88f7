
-- Add featured column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Create promotional banners table
CREATE TABLE public.promotional_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  image_url text DEFAULT NULL,
  bg_color text NOT NULL DEFAULT '#e87b35',
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Owner can manage their banners
CREATE POLICY "Owner can view own banners" ON public.promotional_banners FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert own banners" ON public.promotional_banners FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own banners" ON public.promotional_banners FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own banners" ON public.promotional_banners FOR DELETE USING (auth.uid() = owner_id);

-- Public can view active banners (for public store)
CREATE POLICY "Public can view active banners" ON public.promotional_banners FOR SELECT USING (is_active = true);
