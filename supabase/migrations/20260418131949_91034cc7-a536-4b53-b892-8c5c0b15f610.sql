
-- 1. Categories table
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

-- Seed categories
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

-- 2. Add columns to public_settings
ALTER TABLE public.public_settings
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS engagement_score numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_public_settings_category_id ON public.public_settings(category_id);
CREATE INDEX IF NOT EXISTS idx_public_settings_is_featured ON public.public_settings(is_featured) WHERE is_featured = true;

-- 3. Function to recompute engagement & featured status
CREATE OR REPLACE FUNCTION public.refresh_featured_shops()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compute engagement score per shop
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

  -- Mark top 8 as featured
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

-- Initial population
SELECT public.refresh_featured_shops();
