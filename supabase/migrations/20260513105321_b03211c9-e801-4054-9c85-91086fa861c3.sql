
CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.product_likes FOR SELECT USING (true);
CREATE POLICY "Users insert own likes" ON public.product_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.product_likes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_product ON public.product_likes(product_id);

CREATE TABLE IF NOT EXISTS public.product_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
ALTER TABLE public.product_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saves" ON public.product_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saves" ON public.product_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saves" ON public.product_saves FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_product_saves_product ON public.product_saves(product_id);

CREATE TABLE IF NOT EXISTS public.product_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.product_comments FOR SELECT USING (true);
CREATE POLICY "Users insert own comments" ON public.product_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.product_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.product_comments FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_product ON public.product_comments(product_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Authenticated can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Authenticated can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
