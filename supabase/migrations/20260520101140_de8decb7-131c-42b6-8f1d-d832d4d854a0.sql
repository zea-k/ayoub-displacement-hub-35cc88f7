
-- Create role enum
DO $wrap$ BEGIN CREATE TYPE public.app_role AS ENUM ('seller', 'customer'); EXCEPTION WHEN duplicate_object THEN NULL; END $wrap$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  stock INTEGER NOT NULL DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

INSERT INTO public.categories (name, slug) VALUES
  ('Electronics', 'electronics'), ('Fashion', 'fashion'), ('Home & Garden', 'home-garden'),
  ('Food & Beverages', 'food-beverages'), ('Health & Beauty', 'health-beauty'),
  ('Sports & Outdoors', 'sports-outdoors'), ('Books & Stationery', 'books-stationery'),
  ('Automotive', 'automotive'), ('Agriculture', 'agriculture'), ('Services', 'services')
ON CONFLICT (slug) DO NOTHING;

-- Refactor: drop marketplace tables and rebuild products for inventory model
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

ALTER TABLE public.products DROP COLUMN IF EXISTS seller_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.products DROP COLUMN IF EXISTS image_urls;
ALTER TABLE public.products DROP COLUMN IF EXISTS category_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS price;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS buying_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_alert integer NOT NULL DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner_id uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Owner can view own products" ON public.products;
CREATE POLICY "Owner can view own products" ON public.products FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert products" ON public.products;
CREATE POLICY "Owner can insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update own products" ON public.products;
CREATE POLICY "Owner can update own products" ON public.products FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete own products" ON public.products;
CREATE POLICY "Owner can delete own products" ON public.products FOR DELETE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public can view public products" ON public.products;
CREATE POLICY "Public can view public products" ON public.products FOR SELECT USING (public_visible = true);

CREATE TABLE IF NOT EXISTS public.stock_in (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  buying_price numeric NOT NULL DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (quantity * buying_price) STORED,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_in ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view stock_in" ON public.stock_in;
CREATE POLICY "Owner can view stock_in" ON public.stock_in FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert stock_in" ON public.stock_in;
CREATE POLICY "Owner can insert stock_in" ON public.stock_in FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete stock_in" ON public.stock_in;
CREATE POLICY "Owner can delete stock_in" ON public.stock_in FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  buying_price numeric NOT NULL DEFAULT 0,
  total_sale numeric GENERATED ALWAYS AS (quantity * selling_price) STORED,
  profit numeric GENERATED ALWAYS AS (quantity * (selling_price - buying_price)) STORED,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view sales" ON public.sales;
CREATE POLICY "Owner can view sales" ON public.sales FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert sales" ON public.sales;
CREATE POLICY "Owner can insert sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete sales" ON public.sales;
CREATE POLICY "Owner can delete sales" ON public.sales FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view expenses" ON public.expenses;
CREATE POLICY "Owner can view expenses" ON public.expenses FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert expenses" ON public.expenses;
CREATE POLICY "Owner can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update expenses" ON public.expenses;
CREATE POLICY "Owner can update expenses" ON public.expenses FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete expenses" ON public.expenses;
CREATE POLICY "Owner can delete expenses" ON public.expenses FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.public_settings (
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
DROP POLICY IF EXISTS "Owner can view own settings" ON public.public_settings;
CREATE POLICY "Owner can view own settings" ON public.public_settings FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert own settings" ON public.public_settings;
CREATE POLICY "Owner can insert own settings" ON public.public_settings FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update own settings" ON public.public_settings;
CREATE POLICY "Owner can update own settings" ON public.public_settings FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public can view enabled stores" ON public.public_settings;
CREATE POLICY "Public can view enabled stores" ON public.public_settings FOR SELECT USING (is_public_enabled = true);

CREATE TABLE IF NOT EXISTS public.public_orders (
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
DROP POLICY IF EXISTS "Owner can view own public orders" ON public.public_orders;
CREATE POLICY "Owner can view own public orders" ON public.public_orders FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can update own public orders" ON public.public_orders;
CREATE POLICY "Owner can update own public orders" ON public.public_orders FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete own public orders" ON public.public_orders;
CREATE POLICY "Owner can delete own public orders" ON public.public_orders FOR DELETE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Anyone can place public orders" ON public.public_orders;
CREATE POLICY "Anyone can place public orders" ON public.public_orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.public_orders;
CREATE POLICY "Anyone can view orders by phone" ON public.public_orders FOR SELECT TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_settings_slug ON public.public_settings(slug) WHERE slug != '';

CREATE TABLE IF NOT EXISTS public.instagram_content_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  caption text NOT NULL,
  hashtags text NOT NULL,
  style_type text NOT NULL DEFAULT 'promotional',
  generated_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.instagram_content_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can view own content" ON public.instagram_content_history;
CREATE POLICY "Owner can view own content" ON public.instagram_content_history FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can insert own content" ON public.instagram_content_history;
CREATE POLICY "Owner can insert own content" ON public.instagram_content_history FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner can delete own content" ON public.instagram_content_history;
CREATE POLICY "Owner can delete own content" ON public.instagram_content_history FOR DELETE USING (auth.uid() = owner_id);
