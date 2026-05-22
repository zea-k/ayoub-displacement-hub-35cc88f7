
-- Add public_visible column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT false;

-- Create public_settings table (one row per business owner)
CREATE TABLE public.public_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  logo_url text,
  theme text NOT NULL DEFAULT 'minimal',
  theme_color text NOT NULL DEFAULT '#e87b35',
  is_public_enabled boolean NOT NULL DEFAULT false,
  whatsapp_number text,
  contact_email text,
  contact_phone text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.public_settings ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own settings
CREATE POLICY "Owner can view own settings" ON public.public_settings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert own settings" ON public.public_settings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own settings" ON public.public_settings FOR UPDATE USING (auth.uid() = owner_id);

-- Public can view enabled stores (for the public store page)
CREATE POLICY "Public can view enabled stores" ON public.public_settings FOR SELECT USING (is_public_enabled = true);

-- Create public_orders table
CREATE TABLE public.public_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.public_orders ENABLE ROW LEVEL SECURITY;

-- Owner can manage orders
CREATE POLICY "Owner can view own public orders" ON public.public_orders FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can update own public orders" ON public.public_orders FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own public orders" ON public.public_orders FOR DELETE USING (auth.uid() = owner_id);

-- Anyone can insert public orders (customers placing orders)
CREATE POLICY "Anyone can place public orders" ON public.public_orders FOR INSERT WITH CHECK (true);

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Unique index on slug for URL lookup
CREATE UNIQUE INDEX idx_public_settings_slug ON public.public_settings(slug) WHERE slug != '';
