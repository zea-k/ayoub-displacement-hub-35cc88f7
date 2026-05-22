-- Replace broken subscription_system migration with simple plans seed

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE,
  name text NOT NULL,
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

-- Seed two plans (idempotent)
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