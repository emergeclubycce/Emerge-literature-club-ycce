import supabase from "@/config/supabase";
import React from "react";

export interface DeletePostResult {
  success: boolean;
  error?: string;
}

/**
 * Normalizes formatting tags that span across multiple lines by splitting
 * them into per-line open and close tags so line-by-line rendering preserves formatting.
 */
function normalizeMultilineTags(text: string): string {
  const tagList = ["b", "strong", "i", "em", "u"];
  let normalized = text;
  for (const tag of tagList) {
    const regex = new RegExp(`(<${tag}>)([\\s\\S]*?)(<\\/${tag}>)`, "gi");
    normalized = normalized.replace(regex, (_, open, content, close) => {
      if (!content.includes("\n")) return `${open}${content}${close}`;
      return content
        .split("\n")
        .map((line: string) => (line ? `${open}${line}${close}` : ""))
        .join("\n");
    });
  }
  return normalized;
}

/**
 * Safely parses bold, italic, and underline tags into React elements.
 * Supported tags:
 * - Bold: **text** or <b>text</b> or <strong>text</strong>
 * - Italic: *text* or _text_ or <i>text</i> or <em>text</em>
 * - Underline: <u>text</u>
 * All plain text is safely escaped by React and cannot execute arbitrary HTML/JS (XSS safe).
 */
export function renderFormattedText(text: string | null | undefined): React.ReactNode {
  if (!text) return null;

  // Pre-normalize any multiline tags so each line remains self-contained
  const normalizedText = normalizeMultilineTags(text);

  // Split lines to preserve line breaks faithfully
  const lines = normalizedText.split("\n");

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
  // 1. <b>...</b> or <strong>...</strong> or **...**
  // 2. <i>...</i> or <em>...</em>
  // 3. <u>...</u>
  // 4. *...*
  // 5. _..._
  const pattern = /(<b>[\s\S]*?<\/b>|<strong>[\s\S]*?<\/strong>|\*\*[\s\S]*?\*\*|<i>[\s\S]*?<\/i>|<em>[\s\S]*?<\/em>|<u>[\s\S]*?<\/u>|\*[^\*\n]+?\*|_[^_\n]+?_)/gi;
  const parts = line.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    const lower = part.toLowerCase();

    // Bold: <b>text</b>, <strong>text</strong>, or **text**
    if (lower.startsWith("<b>") && lower.endsWith("</b>") && part.length >= 7) {
      const inner = part.slice(3, -4);
      return <strong key={idx} className="font-bold">{parseLineFormatting(inner)}</strong>;
    }
    if (lower.startsWith("<strong>") && lower.endsWith("</strong>") && part.length >= 17) {
      const inner = part.slice(8, -9);
      return <strong key={idx} className="font-bold">{parseLineFormatting(inner)}</strong>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      return <strong key={idx} className="font-bold">{parseLineFormatting(inner)}</strong>;
    }

    // Italic: <i>text</i> or <em>text</em>
    if (lower.startsWith("<i>") && lower.endsWith("</i>") && part.length >= 7) {
      const inner = part.slice(3, -4);
      return <em key={idx} className="italic">{parseLineFormatting(inner)}</em>;
    }
    if (lower.startsWith("<em>") && lower.endsWith("</em>") && part.length >= 9) {
      const inner = part.slice(4, -5);
      return <em key={idx} className="italic">{parseLineFormatting(inner)}</em>;
    }

    // Underline: <u>text</u>
    if (lower.startsWith("<u>") && lower.endsWith("</u>") && part.length >= 7) {
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
 * Strips formatting tags (<b>, <i>, <u>, <strong>, <em>, **, *, _) from text.
 * Returns clean plain text for metadata, character count, or previews.
 */
export function stripFormatting(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<\/?(b|strong|i|em|u)>/gi, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1");
}

/**
 * Checks whether content contains actual meaningful text (not just empty formatting tags or whitespace).
 */
export function hasMeaningfulText(text: string | null | undefined): boolean {
  if (!text) return false;
  const stripped = stripFormatting(text).replace(/\u00a0/g, " ").trim();
  return stripped.length > 0;
}

/**
 * Safely converts the contenteditable HTML tree into a clean formatted string
 * with only <b>, <i>, <u> tags and \n for line breaks.
 * Strips all unsafe tags, attributes, inline styles (except standard bold/italic/underline), etc.
 */
export function serializeEditorHtml(root: HTMLElement): string {
  if (!root) return "";

  // Check if there is any visible text
  const rawText = (root.innerText || root.textContent || "").replace(/\u00a0/g, " ");
  if (!rawText.trim()) {
    return "";
  }

  function serializeNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.nodeValue || "").replace(/\u00a0/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "br") {
      return "\n";
    }

    let childrenText = "";
    for (let i = 0; i < el.childNodes.length; i++) {
      childrenText += serializeNode(el.childNodes[i]);
    }

    // Determine formatting
    const isBold =
      tag === "b" ||
      tag === "strong" ||
      el.style.fontWeight === "bold" ||
      parseInt(el.style.fontWeight, 10) >= 600;

    const isItalic =
      tag === "i" ||
      tag === "em" ||
      el.style.fontStyle === "italic";

    const isUnderline =
      tag === "u" ||
      (el.style.textDecoration && el.style.textDecoration.includes("underline"));

    let formatted = childrenText;
    if (isUnderline && formatted) {
      formatted = wrapLines(formatted, "u");
    }
    if (isItalic && formatted) {
      formatted = wrapLines(formatted, "i");
    }
    if (isBold && formatted) {
      formatted = wrapLines(formatted, "b");
    }

    // Handle block element wrappers like <div> or <p> created by Enter
    if (el !== root && (tag === "div" || tag === "p")) {
      // If the block contains only a single <br>, it's an empty line placeholder
      if (el.childNodes.length === 1 && el.firstChild?.nodeName.toLowerCase() === "br") {
        formatted = "";
      }
      if (el.previousSibling) {
        return "\n" + formatted;
      }
    }

    return formatted;
  }

  function wrapLines(text: string, tag: "b" | "i" | "u"): string {
    return text
      .split("\n")
      .map((line) => (line.length > 0 ? `<${tag}>${line}</${tag}>` : ""))
      .join("\n");
  }

  const result = serializeNode(root);
  return result.replace(/\r\n/g, "\n").trim();
}

/**
 * Converts a stored formatted string back into clean HTML for display inside the WYSIWYG contenteditable editor.
 */
export function editorValueToHtml(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  return lines
    .map((line) => {
      if (!line) return "<div><br></div>";
      return `<div>${line}</div>`;
    })
    .join("");
}

/**
 * Sanitizes rich text from clipboard paste, keeping only bold, italic, underline, and line breaks.
 * Completely strips all scripts, handlers, images, styles, iframes, links, etc.
 */
export function sanitizePastedHtml(rawHtml: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return "";
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    function cleanNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.nodeValue || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "br") return "<br>";

      let inner = "";
      for (let i = 0; i < el.childNodes.length; i++) {
        inner += cleanNode(el.childNodes[i]);
      }

      if (!inner) return "";

      const isBold =
        tag === "b" ||
        tag === "strong" ||
        el.style.fontWeight === "bold" ||
        parseInt(el.style.fontWeight, 10) >= 600;

      const isItalic =
        tag === "i" ||
        tag === "em" ||
        el.style.fontStyle === "italic";

      const isUnderline =
        tag === "u" ||
        (el.style.textDecoration && el.style.textDecoration.includes("underline"));

      let res = inner;
      if (isUnderline) res = `<u>${res}</u>`;
      if (isItalic) res = `<i>${res}</i>`;
      if (isBold) res = `<b>${res}</b>`;

      if (tag === "div" || tag === "p") {
        return `<div>${res}</div>`;
      }
      return res;
    }

    let result = "";
    for (let i = 0; i < doc.body.childNodes.length; i++) {
      result += cleanNode(doc.body.childNodes[i]);
    }
    return result;
  } catch {
    return "";
  }
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
