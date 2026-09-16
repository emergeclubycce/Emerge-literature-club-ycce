-- =================================================================
-- SECURE ENGAGEMENT COUNTS RPC MIGRATION
-- Run this in your Supabase Project -> SQL Editor
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_post_engagement_counts(target_post_ids bigint[])
RETURNS TABLE(post_id bigint, like_count bigint, bookmark_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS post_id,
    COALESCE(l.cnt, 0)::bigint AS like_count,
    COALESCE(b.cnt, 0)::bigint AS bookmark_count
  FROM unnest(target_post_ids) AS p(id)
  LEFT JOIN (
    SELECT likes.post_id, count(*)::bigint AS cnt
    FROM public.likes
    WHERE likes.post_id = ANY(target_post_ids)
    GROUP BY likes.post_id
  ) l ON l.post_id = p.id
  LEFT JOIN (
    SELECT bookmarks.post_id, count(*)::bigint AS cnt
    FROM public.bookmarks
    WHERE bookmarks.post_id = ANY(target_post_ids)
    GROUP BY bookmarks.post_id
  ) b ON b.post_id = p.id;
END;
$$;

-- Allow anon and authenticated users to fetch engagement counts safely
GRANT EXECUTE ON FUNCTION public.get_post_engagement_counts(bigint[]) TO anon, authenticated, service_role;
