
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

-- Pre-add columns referenced by refresh_featured_shops (filled with defaults; later migrations add real data)
ALTER TABLE public.public_settings ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS saves_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_featured_shops()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  WITH shop_stats AS (
    SELECT ps.owner_id,
      COALESCE(ps.follower_count, 0) * 3.0
        + COALESCE((SELECT SUM(likes_count + comments_count + saves_count) FROM public.products p WHERE p.owner_id = ps.owner_id AND p.public_visible = true), 0) * 1.0
        + COALESCE((SELECT COUNT(*) FROM public.public_orders po WHERE po.owner_id = ps.owner_id), 0) * 2.0
        + COALESCE((SELECT COUNT(*) FROM public.products p2 WHERE p2.owner_id = ps.owner_id AND p2.public_visible = true), 0) * 0.5
        AS score
    FROM public.public_settings ps
    WHERE ps.is_public_enabled = true AND ps.is_listed = true
  )
  UPDATE public.public_settings ps SET engagement_score = ss.score FROM shop_stats ss WHERE ps.owner_id = ss.owner_id;
  UPDATE public.public_settings SET is_featured = false WHERE is_featured = true;
  UPDATE public.public_settings SET is_featured = true
  WHERE owner_id IN (
    SELECT owner_id FROM public.public_settings
    WHERE is_public_enabled = true AND is_listed = true
    ORDER BY engagement_score DESC, follower_count DESC LIMIT 8
  );
END; $$;
REVOKE EXECUTE ON FUNCTION public.refresh_featured_shops() FROM anon, authenticated;
SELECT public.refresh_featured_shops();

CREATE TABLE IF NOT EXISTS public.product_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text NOT NULL, title text NOT NULL, story text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_platforms text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_stories_owner_id_idx ON public.product_stories(owner_id);
CREATE INDEX IF NOT EXISTS product_stories_product_id_idx ON public.product_stories(product_id);
CREATE INDEX IF NOT EXISTS product_stories_created_at_idx ON public.product_stories(created_at DESC);
ALTER TABLE public.product_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own product stories" ON public.product_stories;
CREATE POLICY "Users can view their own product stories" ON public.product_stories FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can create product stories" ON public.product_stories;
CREATE POLICY "Users can create product stories" ON public.product_stories FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can update their own product stories" ON public.product_stories;
CREATE POLICY "Users can update their own product stories" ON public.product_stories FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can delete their own product stories" ON public.product_stories;
CREATE POLICY "Users can delete their own product stories" ON public.product_stories FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE, name text NOT NULL,
  price numeric NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS',
  billing_period text NOT NULL DEFAULT 'monthly',
  trial_days integer NOT NULL DEFAULT 30,
  description text, features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);
INSERT INTO public.subscription_plans (tier, name, price, currency, billing_period, trial_days, description, features, sort_order)
VALUES
  ('free', 'Free', 0, 'TZS', 'monthly', 0, 'Basic buyer account', '["Like products","Comment","Follow shops","View marketplace"]'::jsonb, 0),
  ('premium_monthly', 'Premium Monthly', 25000, 'TZS', 'monthly', 30, 'Full access, billed every month',
   '["Unlimited products","Multi-branch","POS & inventory","Marketplace listing","Instagram AI generator","Priority support"]'::jsonb, 1),
  ('premium_yearly', 'Premium Yearly', 250000, 'TZS', 'yearly', 30, 'Save 2 months, billed once a year',
   '["Everything in Monthly","2 months free","Advanced analytics","Custom branding","Team collaboration"]'::jsonb, 2)
ON CONFLICT (tier) DO UPDATE SET price = EXCLUDED.price, currency = EXCLUDED.currency, name = EXCLUDED.name, description = EXCLUDED.description, features = EXCLUDED.features, updated_at = now();

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'business')),
  subscription_tier text DEFAULT 'free',
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);

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
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription ON public.user_subscriptions (user_id, subscription_tier) WHERE status IN ('active', 'trial');
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(subscription_tier);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('bank', 'mobile_money')),
  provider text NOT NULL, account_identifier text NOT NULL,
  is_default boolean DEFAULT false, verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create payment methods" ON public.payment_methods;
CREATE POLICY "Users can create payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id),
  amount decimal(10, 2) NOT NULL, currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_reference text UNIQUE,
  payment_date timestamp with time zone, due_date timestamp with time zone, paid_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.subscription_payments;
CREATE POLICY "Users can view their own payments" ON public.subscription_payments FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);

CREATE TABLE IF NOT EXISTS public.user_branches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_name text NOT NULL, is_main_branch boolean DEFAULT false,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location text, contact_info jsonb, settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their account branches" ON public.user_branches;
CREATE POLICY "Users can view their account branches" ON public.user_branches FOR SELECT USING (auth.uid() = account_id OR auth.uid() = manager_id);
DROP POLICY IF EXISTS "Account owners can manage branches" ON public.user_branches;
CREATE POLICY "Account owners can manage branches" ON public.user_branches FOR UPDATE USING (auth.uid() = account_id);
DROP POLICY IF EXISTS "Account owners can create branches" ON public.user_branches;
CREATE POLICY "Account owners can create branches" ON public.user_branches FOR INSERT WITH CHECK (auth.uid() = account_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_account_id ON public.user_branches(account_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_is_main ON public.user_branches(is_main_branch);
