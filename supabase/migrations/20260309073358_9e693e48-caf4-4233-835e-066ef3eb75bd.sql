
-- Allow anyone to select public_orders by phone number (for order tracking)
CREATE POLICY "Anyone can view orders by phone"
ON public.public_orders
FOR SELECT
TO anon, authenticated
USING (true);
