-- User Profiles and Subscription Management

-- Create user_profiles table to track user type and subscription info
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'business')),
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium_monthly', 'premium_yearly')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  tier text NOT NULL UNIQUE CHECK (tier IN ('free', 'premium_monthly', 'premium_yearly')),
  price decimal(10, 2) NOT NULL DEFAULT 0,
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'free')),
  trial_days integer DEFAULT 0,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_subscriptions table
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
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_active_subscription UNIQUE (user_id, tier) WHERE status IN ('active', 'trial')
);

-- Create payment_methods table
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

-- Create subscription_payments table
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

-- Create user_branches table for branch management
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

-- Create indexes
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

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment methods" ON public.payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscription_payments
CREATE POLICY "Users can view their own payments" ON public.subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_branches
CREATE POLICY "Users can view their account branches" ON public.user_branches
  FOR SELECT USING (auth.uid() = account_id OR auth.uid() = manager_id);

CREATE POLICY "Account owners can manage branches" ON public.user_branches
  FOR UPDATE USING (auth.uid() = account_id);

CREATE POLICY "Account owners can create branches" ON public.user_branches
  FOR INSERT WITH CHECK (auth.uid() = account_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, tier, price, billing_period, trial_days, description, features)
VALUES
  ('Free', 'free', 0, 'free', 0, 'Basic buyer account', '[
    "Like products",
    "Comment on products",
    "Follow shops",
    "View marketplace",
    "Search products"
  ]'::jsonb),
  ('Premium Monthly', 'premium_monthly', 25000, 'monthly', 30, 'Full business management features', '[
    "Sell on marketplace",
    "Manage inventory",
    "Dashboard analytics",
    "Multiple branches",
    "Advanced reports",
    "Email support",
    "Product stories",
    "Instagram generator"
  ]'::jsonb),
  ('Premium Yearly', 'premium_yearly', 250000, 'yearly', 30, 'Full business features with annual billing', '[
    "Sell on marketplace",
    "Manage inventory",
    "Dashboard analytics",
    "Multiple branches",
    "Advanced reports",
    "Priority support",
    "Product stories",
    "Instagram generator",
    "Custom branding"
  ]'::jsonb)
ON CONFLICT (tier) DO NOTHING;
