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

-- =================================================================
-- PERMANENT SHAYARI POST DELETION & CASCADE MIGRATION
-- Run this in your Supabase Project -> SQL Editor
-- =================================================================

-- 1. Ensure RLS is enabled on public.posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting DELETE policies and add the strict owner DELETE policy
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.posts;
DROP POLICY IF EXISTS "Allow owners to delete their own posts" ON public.posts;

CREATE POLICY "Users can delete own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Configure ON DELETE CASCADE on foreign keys for public.likes and public.bookmarks
-- (Drops existing constraints if named differently and sets explicit cascade)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing foreign key on public.likes(post_id)
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'likes'
          AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        EXECUTE 'ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Drop existing foreign key on public.bookmarks(post_id)
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'bookmarks'
          AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        EXECUTE 'ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Re-add explicit ON DELETE CASCADE foreign key constraints
ALTER TABLE public.likes
ADD CONSTRAINT fk_likes_post
FOREIGN KEY (post_id)
REFERENCES public.posts(id)
ON DELETE CASCADE;

ALTER TABLE public.bookmarks
ADD CONSTRAINT fk_bookmarks_post
FOREIGN KEY (post_id)
REFERENCES public.posts(id)
ON DELETE CASCADE;

