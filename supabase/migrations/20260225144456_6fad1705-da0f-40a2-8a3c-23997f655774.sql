
-- Allow anonymous users to view products that are public_visible
-- This is needed for the public store page
CREATE POLICY "Public can view public products" ON public.products
FOR SELECT USING (public_visible = true);
