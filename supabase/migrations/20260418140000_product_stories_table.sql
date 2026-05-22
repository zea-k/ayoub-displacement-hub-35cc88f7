-- Create product_stories table
CREATE TABLE IF NOT EXISTS product_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  title text NOT NULL,
  story text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_platforms text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS product_stories_owner_id_idx ON product_stories(owner_id);
CREATE INDEX IF NOT EXISTS product_stories_product_id_idx ON product_stories(product_id);
CREATE INDEX IF NOT EXISTS product_stories_created_at_idx ON product_stories(created_at DESC);

-- Enable RLS
ALTER TABLE product_stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own product stories" ON product_stories
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create product stories" ON product_stories
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own product stories" ON product_stories
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own product stories" ON product_stories
  FOR DELETE USING (auth.uid() = owner_id);
