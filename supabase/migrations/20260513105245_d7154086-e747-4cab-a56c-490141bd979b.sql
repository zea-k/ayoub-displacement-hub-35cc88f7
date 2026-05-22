
-- user_account_types
CREATE TABLE IF NOT EXISTS public.user_account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'business' CHECK (account_type IN ('buyer','business')),
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_account_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own account type" ON public.user_account_types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own account type" ON public.user_account_types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own account type" ON public.user_account_types FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trial','active','cancelled','expired','inactive')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id, created_at DESC);

-- payment_attempts
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payment attempts" ON public.payment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payment attempts" ON public.payment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
