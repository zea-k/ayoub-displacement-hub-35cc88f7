
CREATE OR REPLACE FUNCTION public.refresh_featured_shops()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

SELECT public.refresh_featured_shops();
