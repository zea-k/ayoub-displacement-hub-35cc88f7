
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('seller', 'customer');

-- Create profiles table
CREATE TABLE public.profiles (
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

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
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

-- Create orders table
CREATE TABLE public.orders (
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

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Products policies
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers can view own products" ON public.products FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE USING (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));
CREATE POLICY "Sellers can delete own products" ON public.products FOR DELETE USING (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

-- Orders policies
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Sellers can view orders for their products" ON public.orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Sellers can update order status" ON public.orders FOR UPDATE USING (auth.uid() = seller_id);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Fashion', 'fashion'),
  ('Home & Garden', 'home-garden'),
  ('Food & Beverages', 'food-beverages'),
  ('Health & Beauty', 'health-beauty'),
  ('Sports & Outdoors', 'sports-outdoors'),
  ('Books & Stationery', 'books-stationery'),
  ('Automotive', 'automotive'),
  ('Agriculture', 'agriculture'),
  ('Services', 'services');

-- Drop RLS policies on products that depend on has_role
DROP POLICY IF EXISTS "Sellers can insert products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view own products" ON public.products;

-- Now drop the function and enum
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop old marketplace tables
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Modify products table
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

-- New RLS policies for products
CREATE POLICY "Owner can view own products" ON public.products FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own products" ON public.products FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own products" ON public.products FOR DELETE USING (auth.uid() = owner_id);

-- Stock In table
CREATE TABLE public.stock_in (
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
CREATE POLICY "Owner can view stock_in" ON public.stock_in FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert stock_in" ON public.stock_in FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete stock_in" ON public.stock_in FOR DELETE USING (auth.uid() = owner_id);

-- Sales table
CREATE TABLE public.sales (
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
CREATE POLICY "Owner can view sales" ON public.sales FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete sales" ON public.sales FOR DELETE USING (auth.uid() = owner_id);

-- Expenses table
CREATE TABLE public.expenses (
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
CREATE POLICY "Owner can view expenses" ON public.expenses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update expenses" ON public.expenses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete expenses" ON public.expenses FOR DELETE USING (auth.uid() = owner_id);

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
  follower_count integer NOT NULL DEFAULT 0,
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

-- Allow anonymous users to view products that are public_visible
CREATE POLICY "Public can view public products" ON public.products
FOR SELECT USING (public_visible = true);

CREATE TABLE public.instagram_content_history (
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

CREATE POLICY "Owner can view own content" ON public.instagram_content_history FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert own content" ON public.instagram_content_history FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own content" ON public.instagram_content_history FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX idx_instagram_content_owner ON public.instagram_content_history(owner_id);
CREATE INDEX idx_instagram_content_product ON public.instagram_content_history(product_id);

-- Fix public_settings SELECT policies
DROP POLICY "Owner can view own settings" ON public.public_settings;
DROP POLICY "Public can view enabled stores" ON public.public_settings;

CREATE POLICY "Owner can view own settings" ON public.public_settings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Public can view enabled stores" ON public.public_settings FOR SELECT USING (is_public_enabled = true);

-- Fix products SELECT policies too
DROP POLICY "Owner can view own products" ON public.products;
DROP POLICY "Public can view public products" ON public.products;

CREATE POLICY "Owner can view own products" ON public.products FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Public can view public products" ON public.products FOR SELECT USING (public_visible = true);

-- POS SYSTEM
CREATE TABLE public.pos_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_item_discount NUMERIC NOT NULL DEFAULT 0,
  sale_discount_type TEXT DEFAULT 'none',
  sale_discount_value NUMERIC NOT NULL DEFAULT 0,
  sale_discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_total NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  amount_received NUMERIC NOT NULL DEFAULT 0,
  balance_returned NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view pos_sales" ON public.pos_sales FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert pos_sales" ON public.pos_sales FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update pos_sales" ON public.pos_sales FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete pos_sales" ON public.pos_sales FOR DELETE USING (auth.uid() = owner_id);

CREATE UNIQUE INDEX idx_pos_sales_receipt ON public.pos_sales (owner_id, receipt_number);

CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  buying_price NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'none',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  item_subtotal NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view sale_items" ON public.sale_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pos_sales WHERE id = sale_items.sale_id AND owner_id = auth.uid()));
CREATE POLICY "Owner can insert sale_items" ON public.sale_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.pos_sales WHERE id = sale_items.sale_id AND owner_id = auth.uid()));
CREATE POLICY "Owner can delete sale_items" ON public.sale_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.pos_sales WHERE id = sale_items.sale_id AND owner_id = auth.uid()));

CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id),
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  items JSONB,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view refunds" ON public.refunds FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert refunds" ON public.refunds FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.day_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_discounts NUMERIC NOT NULL DEFAULT 0,
  cash_total NUMERIC NOT NULL DEFAULT 0,
  mobile_money_total NUMERIC NOT NULL DEFAULT 0,
  bank_total NUMERIC NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  closed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.day_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view day_closings" ON public.day_closings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert day_closings" ON public.day_closings FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE UNIQUE INDEX idx_day_closings_date ON public.day_closings (owner_id, date);

CREATE TYPE public.app_role AS ENUM ('owner', 'cashier');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.generate_receipt_number(_owner_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
  _date TEXT;
BEGIN
  _date := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO _count
  FROM public.pos_sales
  WHERE owner_id = _owner_id
    AND created_at::date = CURRENT_DATE;
  RETURN 'RCP-' || _date || '-' || LPAD(_count::TEXT, 4, '0');
END;
$$;

CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update suppliers" ON public.suppliers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete suppliers" ON public.suppliers FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  buying_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view purchases" ON public.purchases FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update purchases" ON public.purchases FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete purchases" ON public.purchases FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view activity_logs" ON public.activity_logs FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS saves_count integer NOT NULL DEFAULT 0;

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

CREATE POLICY "Owner can view own banners" ON public.promotional_banners FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert own banners" ON public.promotional_banners FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update own banners" ON public.promotional_banners FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own banners" ON public.promotional_banners FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Public can view active banners" ON public.promotional_banners FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view orders by phone"
ON public.public_orders
FOR SELECT
TO anon, authenticated
USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_orders;
ALTER TABLE public.day_closings ADD COLUMN total_expenses numeric NOT NULL DEFAULT 0;
ALTER TABLE public.day_closings ADD COLUMN net_profit numeric NOT NULL DEFAULT 0;

ALTER TABLE public.public_settings 
ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS category text DEFAULT '';

CREATE POLICY "Public can view listed shops"
ON public.public_settings
FOR SELECT
USING (is_listed = true);

UPDATE public.public_settings SET is_listed = true WHERE is_public_enabled = true;

ALTER TABLE public.public_settings ALTER COLUMN is_listed SET DEFAULT true;

CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_category TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_user ON public.user_activity (user_id, created_at DESC);
CREATE INDEX idx_user_activity_type ON public.user_activity (user_id, activity_type);
CREATE INDEX idx_user_activity_target ON public.user_activity (user_id, target_id);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
ON public.user_activity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
ON public.user_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity"
ON public.user_activity FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
  _slug text;
  _base_slug text;
  _suffix int := 0;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'My Shop');

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, _name, NEW.email)
  ON CONFLICT DO NOTHING;

  _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
  _base_slug := trim(both '-' from _base_slug);
  IF _base_slug = '' THEN
    _base_slug := 'shop-' || substr(NEW.id::text, 1, 8);
  END IF;
  _slug := _base_slug;
  WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
    _suffix := _suffix + 1;
    _slug := _base_slug || '-' || _suffix;
  END LOOP;

  INSERT INTO public.public_settings (
    owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color
  )
  VALUES (
    NEW.id, _name, _slug, true, true, 'minimal', '#7c3aed'
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  u RECORD;
  _name text;
  _slug text;
  _base_slug text;
  _suffix int;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.public_settings ps ON ps.owner_id = au.id
    WHERE ps.id IS NULL
  LOOP
    _name := COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'My Shop');
    _base_slug := regexp_replace(lower(_name), '[^a-z0-9]+', '-', 'g');
    _base_slug := trim(both '-' from _base_slug);
    IF _base_slug = '' THEN
      _base_slug := 'shop-' || substr(u.id::text, 1, 8);
    END IF;
    _slug := _base_slug;
    _suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.public_settings WHERE slug = _slug) LOOP
      _suffix := _suffix + 1;
      _slug := _base_slug || '-' || _suffix;
    END LOOP;

    INSERT INTO public.public_settings (
      owner_id, business_name, slug, is_public_enabled, is_listed, theme, theme_color
    )
    VALUES (u.id, _name, _slug, true, true, 'minimal', '#7c3aed')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.profiles (user_id, name, email)
    VALUES (u.id, _name, u.email)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Anyone can view orders by phone" ON public.public_orders;
CREATE POLICY "Anyone can view orders by phone"
  ON public.public_orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Recreate categories table (was dropped earlier)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Electronics', 'electronics', 'Smartphone', 1),
  ('Fashion & Apparel', 'fashion', 'Shirt', 2),
  ('Food & Beverages', 'food-beverages', 'UtensilsCrossed', 3),
  ('Health & Beauty', 'health-beauty', 'Sparkles', 4),
  ('Home & Garden', 'home-garden', 'Home', 5),
  ('Sports & Outdoors', 'sports', 'Dumbbell', 6),
  ('Books & Stationery', 'books', 'BookOpen', 7),
  ('Toys & Kids', 'toys-kids', 'ToyBrick', 8),
  ('Automotive', 'automotive', 'Car', 9),
  ('Services', 'services', 'Briefcase', 10),
  ('Groceries', 'groceries', 'ShoppingBasket', 11),
  ('Jewelry & Accessories', 'jewelry', 'Gem', 12),
  ('Arts & Crafts', 'arts-crafts', 'Palette', 13),
  ('Pet Supplies', 'pets', 'PawPrint', 14),
  ('Office Supplies', 'office', 'Printer', 15),
  ('Other', 'other', 'Package', 99)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.public_settings
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS engagement_score numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_public_settings_category_id ON public.public_settings(category_id);
CREATE INDEX IF NOT EXISTS idx_public_settings_is_featured ON public.public_settings(is_featured) WHERE is_featured = true;

CREATE OR REPLACE FUNCTION public.refresh_featured_shops()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH shop_stats AS (
    SELECT
      ps.owner_id,
      COALESCE(ps.follower_count, 0) * 3.0
        + COALESCE((SELECT SUM(likes_count + comments_count + saves_count)
                    FROM public.products p WHERE p.owner_id = ps.owner_id AND p.public_visible = true), 0) * 1.0
        + COALESCE((SELECT COUNT(*) FROM public.public_orders po WHERE po.owner_id = ps.owner_id), 0) * 2.0
        + COALESCE((SELECT COUNT(*) FROM public.products p2 WHERE p2.owner_id = ps.owner_id AND p2.public_visible = true), 0) * 0.5
        AS score
    FROM public.public_settings ps
    WHERE ps.is_public_enabled = true AND ps.is_listed = true
  )
  UPDATE public.public_settings ps
  SET engagement_score = ss.score
  FROM shop_stats ss
  WHERE ps.owner_id = ss.owner_id;

  UPDATE public.public_settings SET is_featured = false WHERE is_featured = true;

  UPDATE public.public_settings
  SET is_featured = true
  WHERE owner_id IN (
    SELECT owner_id FROM public.public_settings
    WHERE is_public_enabled = true AND is_listed = true
    ORDER BY engagement_score DESC, follower_count DESC
    LIMIT 8
  );
END;
$$;

SELECT public.refresh_featured_shops();

CREATE TABLE IF NOT EXISTS product_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  title text NOT NULL,
  story text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_platforms text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS product_stories_owner_id_idx ON product_stories(owner_id);
CREATE INDEX IF NOT EXISTS product_stories_product_id_idx ON product_stories(product_id);
CREATE INDEX IF NOT EXISTS product_stories_created_at_idx ON product_stories(created_at DESC);

ALTER TABLE product_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product stories" ON product_stories
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create product stories" ON product_stories
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own product stories" ON product_stories
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own product stories" ON product_stories
  FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  billing_period text NOT NULL DEFAULT 'monthly',
  trial_days integer NOT NULL DEFAULT 30,
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans
  FOR SELECT USING (true);

INSERT INTO public.subscription_plans (tier, name, price, currency, billing_period, trial_days, description, features, sort_order)
VALUES
  ('premium_monthly', 'Premium Monthly', 25000, 'TZS', 'monthly', 30,
   'Full access, billed every month',
   '["Unlimited products","Multi-branch","POS & inventory","Marketplace listing","Instagram AI generator","Priority support"]'::jsonb, 1),
  ('premium_yearly', 'Premium Yearly', 250000, 'TZS', 'yearly', 30,
   'Save 2 months, billed once a year',
   '["Everything in Monthly","2 months free","Advanced analytics","Custom branding","Team collaboration"]'::jsonb, 2)
ON CONFLICT (tier) DO UPDATE
  SET price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      features = EXCLUDED.features,
      updated_at = now();

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'business')),
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium_monthly', 'premium_yearly')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  subscription_tier text NOT NULL,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'trial', 'active', 'expired', 'cancelled')),
  started_at timestamp with time zone DEFAULT now(),
  trial_started_at timestamp with time zone,
  trial_ends_at timestamp with time zone,
  ends_at timestamp with time zone,
  auto_renew boolean DEFAULT true,
  payment_method_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('bank', 'mobile_money')),
  provider text NOT NULL,
  account_identifier text NOT NULL,
  is_default boolean DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id),
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_reference text UNIQUE,
  payment_date timestamp with time zone,
  due_date timestamp with time zone,
  paid_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_branches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_name text NOT NULL,
  is_main_branch boolean DEFAULT false,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location text,
  contact_info jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_user_branches_account_id ON public.user_branches(account_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_is_main ON public.user_branches(is_main_branch);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile (user_profiles)" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (user_profiles)" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment methods" ON public.payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments" ON public.subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their account branches" ON public.user_branches
  FOR SELECT USING (auth.uid() = account_id OR auth.uid() = manager_id);

CREATE POLICY "Account owners can manage branches" ON public.user_branches
  FOR UPDATE USING (auth.uid() = account_id);

CREATE POLICY "Account owners can create branches" ON public.user_branches
  FOR INSERT WITH CHECK (auth.uid() = account_id);
