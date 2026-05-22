
CREATE TABLE public.instagram_content_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  caption text NOT NULL,
  hashtags text NOT NULL,
  style_type text NOT NULL DEFAULT 'promotional',
  generated_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own content" ON public.instagram_content_history FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert own content" ON public.instagram_content_history FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete own content" ON public.instagram_content_history FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX idx_instagram_content_owner ON public.instagram_content_history(owner_id);
CREATE INDEX idx_instagram_content_product ON public.instagram_content_history(product_id);
