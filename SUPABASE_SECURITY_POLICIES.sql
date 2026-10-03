-- ==============================================================================
-- 🛡️ EMERGE LITERATURE CLUB - SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard:
-- Supabase Studio -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memory_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memory_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookmarks ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTION: IS_ADMIN()
-- Securely checks if the currently authenticated user exists in the admins table.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. POLICIES FOR: admins TABLE
-- Protects admin list from unauthorized modification or enumeration.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins table select policy" ON public.admins;
DROP POLICY IF EXISTS "Admins table insert policy" ON public.admins;
DROP POLICY IF EXISTS "Admins table update policy" ON public.admins;
DROP POLICY IF EXISTS "Admins table delete policy" ON public.admins;

-- Any authenticated user can only verify if their OWN user_id is in the admin table
CREATE POLICY "Admins table select policy"
ON public.admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Only existing admins can promote new admins
CREATE POLICY "Admins table insert policy"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only existing admins can update admin records
CREATE POLICY "Admins table update policy"
ON public.admins
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only existing admins can remove admins
CREATE POLICY "Admins table delete policy"
ON public.admins
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. POLICIES FOR: posts TABLE (SHAYARI / SUBMISSIONS)
-- Enforces:
-- - Public can only read APPROVED posts.
-- - Authors can read their own pending/rejected posts.
-- - Submissions MUST have status = 'pending' (stops users auto-approving).
-- - Submissions MUST match auth.uid().
-- - Only admins can approve/reject posts.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view approved posts" ON public.posts;
DROP POLICY IF EXISTS "Authors and admins can view posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can submit pending posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update posts" ON public.posts;
DROP POLICY IF EXISTS "Authors and admins can delete posts" ON public.posts;

-- Read: Public can view approved posts; authors can view their own; admins view all
CREATE POLICY "Public can view approved posts"
ON public.posts
FOR SELECT
TO public
USING (
  status = 'approved' 
  OR auth.uid() = user_id 
  OR public.is_admin()
);

-- Insert: Enforces status = 'pending' and user_id = auth.uid()
CREATE POLICY "Authenticated users can submit pending posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- Update: Only admins can change post status or edit post details
CREATE POLICY "Admins can update posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Delete: Authors can delete their own posts; admins can delete any post
CREATE POLICY "Authors and admins can delete posts"
ON public.posts
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 5. POLICIES FOR: profiles TABLE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Public can view profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. POLICIES FOR: events TABLE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Public can view events"
ON public.events
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can insert events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. POLICIES FOR: memories, memory_photos, memory_winners
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view memories" ON public.memories;
DROP POLICY IF EXISTS "Admins can manage memories" ON public.memories;

CREATE POLICY "Public can view memories"
ON public.memories FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage memories"
ON public.memories FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Memory Photos
DROP POLICY IF EXISTS "Public can view memory_photos" ON public.memory_photos;
DROP POLICY IF EXISTS "Admins can manage memory_photos" ON public.memory_photos;

CREATE POLICY "Public can view memory_photos"
ON public.memory_photos FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage memory_photos"
ON public.memory_photos FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Memory Winners
DROP POLICY IF EXISTS "Public can view memory_winners" ON public.memory_winners;
DROP POLICY IF EXISTS "Admins can manage memory_winners" ON public.memory_winners;

CREATE POLICY "Public can view memory_winners"
ON public.memory_winners FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage memory_winners"
ON public.memory_winners FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. POLICIES FOR: likes & bookmarks TABLES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Public can view likes"
ON public.likes FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own likes"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON public.likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can view own bookmarks"
ON public.bookmarks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
ON public.bookmarks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON public.bookmarks FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ==============================================================================
-- ✅ SUCCESS: All database tables are now locked down with RLS.
-- ==============================================================================
