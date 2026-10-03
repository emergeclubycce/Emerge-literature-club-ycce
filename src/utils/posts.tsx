import { logger } from "@/utils/logger";
import supabase from "@/config/supabase";
import React from "react";

export interface DeletePostResult {
  success: boolean;
  error?: string;
}

/**
 * Safely parses markdown-like bold, italic, underline, and heading tags into React elements.
 * Supported tags:
 * - Heading: <h>text</h>  → renders as larger bold text
 * - Bold: **text** or <b>text</b>
 * - Italic: *text* or _text_ or <i>text</i>
 * - Underline: <u>text</u>
 * All plain text is safely escaped by React and cannot execute arbitrary HTML/JS (XSS safe).
 */
export function renderFormattedText(text: string | null | undefined): React.ReactNode {
  if (!text) return null;

  // Split lines to preserve line breaks faithfully
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    return (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {parseLineFormatting(line)}
      </React.Fragment>
    );
  });
}

function parseLineFormatting(line: string): React.ReactNode[] {
  if (!line) return [];

  // Regex pattern matching:
  // 1. <b>...</b> or **...**
  // 2. <i>...</i>
  // 3. <u>...</u>
  // 4. *...*
  // 5. _..._
  const pattern = /(<h>[\s\S]*?<\/h>|<b>[\s\S]*?<\/b>|\*\*[\s\S]*?\*\*|<i>[\s\S]*?<\/i>|<u>[\s\S]*?<\/u>|\*[^\*\n]+?\*|_[^_\n]+?_)/g;
  const parts = line.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Heading: <h>text</h> → larger bold text (for titles inside poems)
    if (part.startsWith("<h>") && part.endsWith("</h>")) {
      const inner = part.slice(3, -4);
      return <span key={idx} className="text-lg font-bold leading-snug block">{parseLineFormatting(inner)}</span>;
    }

    // Bold: <b>text</b> or **text**
    if (part.startsWith("<b>") && part.endsWith("</b>")) {
      const inner = part.slice(3, -4);
      return <strong key={idx} className="font-bold">{parseLineFormatting(inner)}</strong>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      return <strong key={idx} className="font-bold">{parseLineFormatting(inner)}</strong>;
    }

    // Italic: <i>text</i>
    if (part.startsWith("<i>") && part.endsWith("</i>")) {
      const inner = part.slice(3, -4);
      return <em key={idx} className="italic">{parseLineFormatting(inner)}</em>;
    }

    // Underline: <u>text</u>
    if (part.startsWith("<u>") && part.endsWith("</u>")) {
      const inner = part.slice(3, -4);
      return <u key={idx} className="underline underline-offset-2">{parseLineFormatting(inner)}</u>;
    }

    // Italic markdown fallback: *text* (when not double asterisk)
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) {
      const inner = part.slice(1, -1);
      return <em key={idx} className="italic">{parseLineFormatting(inner)}</em>;
    }

    // Italic markdown fallback: _text_
    if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return <em key={idx} className="italic">{parseLineFormatting(inner)}</em>;
    }

    // Default plain text (React safely auto-escapes this)
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Permanently deletes a Shayari post.
 * 
 * Authorization:
 *   - The post OWNER can delete their own post.
 *   - An ADMIN (row in public.admins) can delete ANY post.
 *
 * Steps:
 * 1. Checks authenticated user session (auth.uid()).
 * 2. Fetches post record to get image_url and verify it exists.
 * 3. Checks if the caller is an admin via the public.admins table.
 * 4. Enforces ownership for non-admins.
 * 5. Cleans up related likes & bookmarks.
 * 6. Deletes the post row (RLS on Supabase enforces the final permission).
 * 7. Cleans up the image from Supabase Storage if applicable.
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

    // 3b. Check if the current user is an admin — admins can delete any post
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    const isAdmin = !!adminRecord;

    // 3c. Ownership gate: non-admins can only delete their own posts
    if (!isAdmin && postRecord.user_id !== currentUser.id) {
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

    // 5. Permanently delete from public.posts.
    // Two separate paths so TypeScript types are clean and no query builder mutation occurs.
    // The RLS policy on Supabase must allow: auth.uid() = user_id OR public.is_admin()
    let deletedRows: { id: number }[] | null = null;
    let deleteErr: any = null;

    logger.log("[deleteShayariPost] isAdmin:", isAdmin, "postOwner:", postRecord.user_id, "currentUser:", currentUser.id);

    if (isAdmin) {
      // Admin path: delete by post id only — RLS allows admins to delete any post
      const result = await supabase
        .from("posts")
        .delete()
        .eq("id", numericPostId)
        .select("id");
      deletedRows = result.data as { id: number }[] | null;
      deleteErr = result.error;
    } else {
      // Owner path: delete with both id AND user_id for safety
      const result = await supabase
        .from("posts")
        .delete()
        .eq("id", numericPostId)
        .eq("user_id", currentUser.id)
        .select("id");
      deletedRows = result.data as { id: number }[] | null;
      deleteErr = result.error;
    }

    if (deleteErr) {
      logger.error("[deleteShayariPost] deleteErr:", deleteErr);
      return {
        success: false,
        error: `Database deletion failed: ${deleteErr.message}`,
      };
    }

    logger.log("[deleteShayariPost] deletedRows:", deletedRows);

    // If RLS blocked the deletion or no row was removed, deletedRows is empty:
    if (!deletedRows || deletedRows.length === 0) {
      return {
        success: false,
        error: isAdmin
          ? "Admin delete failed — please ensure the RLS policy 'Authors and admins can delete posts' is applied in your Supabase Dashboard (SQL Editor → run SUPABASE_SECURITY_POLICIES.sql)."
          : "Post could not be deleted. You can only delete your own posts.",
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
        logger.warn("Storage cleanup notice (non-fatal):", storageErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    logger.error("deleteShayariPost caught error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred while deleting the post.",
    };
  }
}
