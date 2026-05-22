
-- =============================================
-- POS SYSTEM DATABASE MIGRATION
-- =============================================

-- 1. POS Sales (header table for multi-product sales)
CREATE TABLE public.pos_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_item_discount NUMERIC NOT NULL DEFAULT 0,
  sale_discount_type TEXT DEFAULT 'none', -- none, percentage, fixed
  sale_discount_value NUMERIC NOT NULL DEFAULT 0,
  sale_discount_amount NUMERIC NOT NULL DEFAULT 0,
  final_total NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- cash, mobile_money, bank
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

-- Unique receipt numbers per owner
CREATE UNIQUE INDEX idx_pos_sales_receipt ON public.pos_sales (owner_id, receipt_number);

-- 2. Sale Items (line items for each sale)
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  buying_price NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'none', -- none, percentage, fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  item_subtotal NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- sale_items inherit access from pos_sales via sale_id
CREATE POLICY "Owner can view sale_items" ON public.sale_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pos_sales WHERE id = sale_items.sale_id AND owner_id = auth.uid()));
CREATE POLICY "Owner can insert sale_items" ON public.sale_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.pos_sales WHERE id = sale_items.sale_id AND owner_id = auth.uid()));
CREATE POLICY "Owner can delete sale_items" ON public.sale_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.pos_sales WHERE id = sale_items.sale_id AND owner_id = auth.uid()));

-- 3. Refunds
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id),
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  items JSONB, -- [{product_id, product_name, quantity, unit_price}]
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view refunds" ON public.refunds FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert refunds" ON public.refunds FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 4. Day Closings
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

-- 5. User Roles (following security best practices)
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

-- Security definer function to check roles
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

-- Generate receipt number function
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
