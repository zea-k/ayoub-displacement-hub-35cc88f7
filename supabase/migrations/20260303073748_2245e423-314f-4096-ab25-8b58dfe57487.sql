
-- 1. Suppliers table
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

-- 2. Purchases table
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

-- 3. Activity logs table
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
