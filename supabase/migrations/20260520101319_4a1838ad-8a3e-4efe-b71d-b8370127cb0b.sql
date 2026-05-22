
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  buying_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT, date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view purchases" ON public.purchases;
CREATE POLICY "Owner can view purchases" ON public.purchases FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert purchases" ON public.purchases;
CREATE POLICY "Owner can insert purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update purchases" ON public.purchases;
CREATE POLICY "Owner can update purchases" ON public.purchases FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete purchases" ON public.purchases;
CREATE POLICY "Owner can delete purchases" ON public.purchases FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  action_type TEXT NOT NULL, description TEXT NOT NULL, related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view activity_logs" ON public.activity_logs;
CREATE POLICY "Owner can view activity_logs" ON public.activity_logs FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert activity_logs" ON public.activity_logs;
CREATE POLICY "Owner can insert activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '', subtitle text DEFAULT '',
  image_url text DEFAULT NULL, bg_color text NOT NULL DEFAULT '#e87b35',
  is_active boolean NOT NULL DEFAULT true, position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view own banners" ON public.promotional_banners;
CREATE POLICY "Owner can view own banners" ON public.promotional_banners FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert own banners" ON public.promotional_banners;
CREATE POLICY "Owner can insert own banners" ON public.promotional_banners FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update own banners" ON public.promotional_banners;
CREATE POLICY "Owner can update own banners" ON public.promotional_banners FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete own banners" ON public.promotional_banners;
CREATE POLICY "Owner can delete own banners" ON public.promotional_banners FOR DELETE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public can view active banners" ON public.promotional_banners;
CREATE POLICY "Public can view active banners" ON public.promotional_banners FOR SELECT USING (is_active = true);

DO $wrap$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.public_orders; EXCEPTION WHEN OTHERS THEN NULL; END $wrap$;

-- Categories (recreated with extra cols)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  icon text, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can manage categories" ON public.categories;
CREATE POLICY "Owners can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

ALTER TABLE public.public_settings ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;
ALTER TABLE public.public_settings ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE public.public_settings ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.public_settings ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.public_settings ADD COLUMN IF NOT EXISTS engagement_score numeric NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_public_settings_category_id ON public.public_settings(category_id);
CREATE INDEX IF NOT EXISTS idx_public_settings_is_featured ON public.public_settings(is_featured) WHERE is_featured = true;

DROP POLICY IF EXISTS "Public can view listed shops" ON public.public_settings;
CREATE POLICY "Public can view listed shops" ON public.public_settings FOR SELECT USING (is_listed = true);
UPDATE public.public_settings SET is_listed = true WHERE is_public_enabled = true;

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, target_id TEXT NOT NULL,
  target_category TEXT DEFAULT '', duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity (user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_target ON public.user_activity (user_id, target_id);
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own activity" ON public.user_activity;
CREATE POLICY "Users can delete own activity" ON public.user_activity FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _name text; _slug text; _base_slug text; _suffix int := 0;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'My Shop');
  INSERT INTO public.profiles (user_id, name, email) VALUES (NEW.id, _name, NEW.email) ON CONFLICT DO NOTHING;
  _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
  _base_slug := trim(both '-' from _base_slug);
  IF _base_slug = '' THEN _base_slug := 'shop-' || substr(NEW.id::text, 1, 8); END IF;
  _slug := _base_slug;
  WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
    _suffix := _suffix + 1; _slug := _base_slug || '-' || _suffix;
  END LOOP;
  INSERT INTO public.public_settings (owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color)
    VALUES (NEW.id, _name, _slug, true, true, 'minimal', '#7c3aed') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
DO $$
DECLARE u RECORD; _name text; _slug text; _base_slug text; _suffix int;
BEGIN
  FOR u IN SELECT au.id, au.email, au.raw_user_meta_data FROM auth.users au
    LEFT JOIN public.public_settings ps ON ps.owner_id = au.id WHERE ps.id IS NULL
  LOOP
    _name := COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'My Shop');
    _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
    _base_slug := trim(both '-' from _base_slug);
    IF _base_slug = '' THEN _base_slug := 'shop-' || substr(u.id::text, 1, 8); END IF;
    _slug := _base_slug; _suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
      _suffix := _suffix + 1; _slug := _base_slug || '-' || _suffix;
    END LOOP;
    INSERT INTO public.public_settings (owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color)
      VALUES (u.id, _name, _slug, true, true, 'minimal', '#7c3aed') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (user_id, name, email) VALUES (u.id, _name, u.email) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
