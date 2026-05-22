
-- User activity tracking for personalization engine
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- view_shop, view_product, click_shop, click_product
  target_id TEXT NOT NULL, -- shop slug or product id
  target_category TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast aggregation queries
CREATE INDEX idx_user_activity_user ON public.user_activity (user_id, created_at DESC);
CREATE INDEX idx_user_activity_type ON public.user_activity (user_id, activity_type);
CREATE INDEX idx_user_activity_target ON public.user_activity (user_id, target_id);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can view own activity
CREATE POLICY "Users can view own activity"
ON public.user_activity FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own activity
CREATE POLICY "Users can insert own activity"
ON public.user_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own activity (privacy)
CREATE POLICY "Users can delete own activity"
ON public.user_activity FOR DELETE
USING (auth.uid() = user_id);
