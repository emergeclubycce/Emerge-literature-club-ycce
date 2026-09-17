import supabase from "@/config/supabase";

export interface DeletePostResult {
  success: boolean;
  error?: string;
}

/**
 * Permanently deletes a Shayari post owned by the authenticated user.
 * 
 * 1. Strictly checks authenticated user session (auth.uid()).
 * 2. Enforces ownership: only post owner (post.user_id === auth.uid()) can delete.
 * 3. Removes post row from public.posts:
 *    DELETE FROM public.posts WHERE id = target_post_id AND user_id = auth.uid()
 *    Using .select() to verify at least 1 row was actually deleted.
 * 4. Cleans up any orphaned likes or bookmarks associated with this post.
 * 5. Cleans up the uploaded image from the "post-images" Supabase Storage bucket
 *    if the post contained an uploaded file in that bucket.
 */
export async function deleteShayariPost(
  postId: number | string,
  expectedUserId?: string | null
): Promise<DeletePostResult> {
  const numericPostId =
    typeof postId === "number"
      ? postId
      : typeof postId === "string" && !isNaN(Number(postId))
      ? Number(postId)
      : null;

  if (!numericPostId || numericPostId <= 0) {
    return { success: false, error: "Invalid post ID." };
  }

  // 1. Authenticate user session
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && authError.message?.toLowerCase().includes("refresh token")) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  }

  const currentUser = authData?.user;
  if (!currentUser) {
    return {
      success: false,
      error: "You must be logged in to delete your post.",
    };
  }

  // 2. Enforce expected ownership if provided
  if (expectedUserId && expectedUserId !== currentUser.id) {
    return {
      success: false,
      error: "You are not authorized to delete another user's post.",
    };
  }

  try {
    // 3. Look up post details first (to obtain image_url for storage cleanup & verify ownership)
    const { data: postRecord, error: fetchErr } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", numericPostId)
      .maybeSingle();

    if (fetchErr) {
      return {
        success: false,
        error: `Failed to verify post: ${fetchErr.message}`,
      };
    }

    if (!postRecord) {
      return {
        success: false,
        error: "Post not found or has already been deleted.",
      };
    }

    if (postRecord.user_id !== currentUser.id) {
      return {
        success: false,
        error: "You can only delete your own posts.",
      };
    }

    // 4. Clean up any related likes and bookmarks for this post
    // Note: If foreign keys already CASCADE on DELETE, this acts as a safe guarantee.
    // If foreign keys do NOT cascade yet, this prevents foreign-key constraint violation (23503).
    await Promise.allSettled([
      supabase.from("likes").delete().eq("post_id", numericPostId),
      supabase.from("bookmarks").delete().eq("post_id", numericPostId),
    ]);

    // 5. Permanently delete from public.posts with strict ownership check
    // We append .select("id") so PostgREST returns deleted rows; if 0 rows deleted, we catch it!
    const { data: deletedRows, error: deleteErr } = await supabase
      .from("posts")
      .delete()
      .eq("id", numericPostId)
      .eq("user_id", currentUser.id)
      .select("id");

    if (deleteErr) {
      return {
        success: false,
        error: `Database deletion failed: ${deleteErr.message}`,
      };
    }

    // If RLS blocked the deletion or no row was removed, deletedRows is empty:
    if (!deletedRows || deletedRows.length === 0) {
      return {
        success: false,
        error:
          "Post could not be deleted. Please verify your database RLS permissions or post ownership.",
      };
    }

    // 6. Safe Supabase Storage image cleanup:
    // Only delete if the image is in the 'post-images' bucket and belongs to this user
    if (
      postRecord.image_url &&
      postRecord.image_url.includes("/post-images/")
    ) {
      try {
        const parts = postRecord.image_url.split("/post-images/");
        if (parts[1]) {
          const rawPath = decodeURIComponent(parts[1].split("?")[0]);
          // Verify that file path begins with user's ID to avoid deleting foreign images
          if (rawPath.startsWith(`${currentUser.id}/`)) {
            await supabase.storage.from("post-images").remove([rawPath]);
          }
        }
      } catch (storageErr) {
        console.warn("Storage cleanup notice (non-fatal):", storageErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteShayariPost caught error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while deleting the post.",
    };
  }
}
