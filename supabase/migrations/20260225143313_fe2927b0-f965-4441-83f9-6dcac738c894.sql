
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
