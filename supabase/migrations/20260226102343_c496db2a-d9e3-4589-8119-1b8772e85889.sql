
-- Fix public_settings SELECT policies: both restrictive means AND logic, owner can't see disabled settings
DROP POLICY "Owner can view own settings" ON public.public_settings;
DROP POLICY "Public can view enabled stores" ON public.public_settings;

-- Recreate as PERMISSIVE (OR logic): owner can always see theirs, public can see enabled ones
CREATE POLICY "Owner can view own settings" ON public.public_settings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Public can view enabled stores" ON public.public_settings FOR SELECT USING (is_public_enabled = true);

-- Fix products SELECT policies too (same issue)
DROP POLICY "Owner can view own products" ON public.products;
DROP POLICY "Public can view public products" ON public.products;

CREATE POLICY "Owner can view own products" ON public.products FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Public can view public products" ON public.products FOR SELECT USING (public_visible = true);
