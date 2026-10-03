"use client";

import { logger } from "@/utils/logger";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import {
  Bookmark,
  HeartIcon,
  Send,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Copy,
  Feather,
  Sparkles,
  X
} from "lucide-react";
import supabase from "@/config/supabase";
import { fetchPostEngagement } from "@/utils/engagement";
import { deleteShayariPost, renderFormattedText } from "@/utils/posts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface SherProp {
  id?: number | string;
  name?: string;
  writter?: string;
  caption: string;
  image?: string | null;
  idx?: number;
  authorPhoto?: string | null;
  createdAt?: string | null;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  likeCount?: number;
  bookmarkCount?: number;
  currentUserId?: string | null;
  userId?: string | null;
  onDelete?: (id: number | string) => void;
  status?: "pending" | "approved" | "rejected";
}

function SherCard({
  id,
  name,
  writter,
  caption,
  image,
  idx,
  authorPhoto,
  createdAt,
  initialLiked,
  initialBookmarked,
  likeCount = 0,
  bookmarkCount = 0,
  currentUserId,
  userId,
  onDelete,
  status,
}: SherProp) {
  const router = useRouter();

  const [isLiked, setIsLiked] = useState<boolean>(!!initialLiked);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(!!initialBookmarked);
  const [likesCount, setLikesCount] = useState<number>(likeCount ?? 0);
  const [bookmarksCount, setBookmarksCount] = useState<number>(bookmarkCount ?? 0);
  const [isProcessingLike, setIsProcessingLike] = useState<boolean>(false);
  const [isProcessingBookmark, setIsProcessingBookmark] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [authorPhotoError, setAuthorPhotoError] = useState<boolean>(false);
  const [captionExpanded, setCaptionExpanded] = useState<boolean>(false);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);

  // Instagram-style double tap to like
  const [showHeartPop, setShowHeartPop] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setAuthorPhotoError(false);
  }, [authorPhoto]);

  useEffect(() => {
    if (likeCount !== undefined) setLikesCount(likeCount);
  }, [likeCount]);

  useEffect(() => {
    if (bookmarkCount !== undefined) setBookmarksCount(bookmarkCount);
  }, [bookmarkCount]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(currentUserId ?? null);

  const authorName = writter || "Anonymous";
  const shareId = id ?? name;

  // Resolve current logged in user if not passed directly in props
  useEffect(() => {
    if (currentUserId !== undefined) {
      setSessionUserId(currentUserId);
    } else {
      let isMounted = true;
      supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (error && error.message?.toLowerCase().includes("refresh token")) {
            supabase.auth.signOut({ scope: "local" }).catch(() => {});
          }
          if (isMounted && data?.user) {
            setSessionUserId(data.user.id);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [currentUserId]);

  const effectiveUserId = currentUserId !== undefined ? currentUserId : sessionUserId;

  // Strict ownership check
  const isOwner = Boolean(effectiveUserId && userId && effectiveUserId === userId);

  // Sync with prop updates if provided
  useEffect(() => {
    if (initialLiked !== undefined) {
      setIsLiked(initialLiked);
    }
  }, [initialLiked]);

  useEffect(() => {
    if (initialBookmarked !== undefined) {
      setIsBookmarked(initialBookmarked);
    }
  }, [initialBookmarked]);

  // If initialLiked or initialBookmarked are not passed, fetch for current user
  useEffect(() => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    if (!numericPostId) return;

    let isMounted = true;

    if (initialLiked === undefined || initialBookmarked === undefined) {
      supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (error && error.message?.toLowerCase().includes("refresh token")) {
            supabase.auth.signOut({ scope: "local" }).catch(() => {});
          }
          if (!isMounted || !data?.user) return;
          const uid = data.user.id;

          if (initialLiked === undefined) {
            supabase
              .from("likes")
              .select("post_id")
              .eq("user_id", uid)
              .eq("post_id", numericPostId)
              .maybeSingle()
              .then(({ data: lData }) => {
                if (isMounted && lData) setIsLiked(true);
              });
          }

          if (initialBookmarked === undefined) {
            supabase
              .from("bookmarks")
              .select("post_id")
              .eq("user_id", uid)
              .eq("post_id", numericPostId)
              .maybeSingle()
              .then(({ data: bData }) => {
                if (isMounted && bData) setIsBookmarked(true);
              });
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [id, initialLiked, initialBookmarked]);

  // Fetch engagement counts if not passed via props
  useEffect(() => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    if (!numericPostId) return;

    if (likeCount === undefined || bookmarkCount === undefined) {
      fetchPostEngagement([numericPostId]).then((countsMap) => {
        if (countsMap[numericPostId]) {
          if (likeCount === undefined) setLikesCount(countsMap[numericPostId].likes);
          if (bookmarkCount === undefined) setBookmarksCount(countsMap[numericPostId].bookmarks);
        }
      });
    }
  }, [id, likeCount, bookmarkCount]);

  // Handle Like Toggle
  const handleToggleLike = async () => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    if (!numericPostId || isProcessingLike) return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr && authErr.message?.toLowerCase().includes("refresh token")) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
    const user = authData?.user;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    setIsProcessingLike(true);

    try {
      if (nextLiked) {
        const { error } = await supabase.from("likes").insert({
          user_id: user.id,
          post_id: numericPostId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", numericPostId);
        if (error) throw error;
      }
    } catch (err) {
      logger.error("Failed to update like status:", err);
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsProcessingLike(false);
    }
  };

  // Handle double-tap on image (Instagram signature gesture)
  const handleImageTouch = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        handleToggleLike();
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    }
    lastTapRef.current = now;
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async () => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    if (!numericPostId || isProcessingBookmark) return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr && authErr.message?.toLowerCase().includes("refresh token")) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
    const user = authData?.user;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);
    setBookmarksCount((prev) => (nextBookmarked ? prev + 1 : Math.max(0, prev - 1)));
    setIsProcessingBookmark(true);

    try {
      if (nextBookmarked) {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          post_id: numericPostId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", numericPostId);
        if (error) throw error;
      }
    } catch (err) {
      logger.error("Failed to update bookmark status:", err);
      setIsBookmarked(!nextBookmarked);
      setBookmarksCount((prev) => (!nextBookmarked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsProcessingBookmark(false);
    }
  };

  // Handle Share
  const handleShare = async () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://emergeycce.club";
    const shareUrl = `${origin}/shers/share/${shareId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Poem by ${authorName}`,
          text: caption,
          url: shareUrl,
        });
        return;
      } catch (error) {
        logger.log("Share cancelled", error);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      logger.log("Clipboard copy failed");
    }
  };

  // Handle Owner Delete
  const handleConfirmDelete = async () => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    const targetUserId = effectiveUserId;
    if (!numericPostId || !targetUserId) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const result = await deleteShayariPost(numericPostId, targetUserId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete post.");
      }

      setShowDeleteModal(false);
      setShowOptionsModal(false);
      if (onDelete) {
        onDelete(numericPostId);
      } else {
        router.push("/shers");
      }
    } catch (err: any) {
      logger.error("Failed to delete post:", err);
      setDeleteError(err.message || "Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Caption truncation logic for Instagram-style "... more"
  const isLongCaption = caption && caption.length > 110;
  const showTruncated = isLongCaption && !captionExpanded;

  return (
    <article
      className={`${inter.className} w-full max-w-md mx-auto bg-white border-b border-gray-200/80 sm:border sm:rounded-2xl sm:shadow-xs overflow-hidden transition-all relative select-none sm:select-auto`}
    >
      {/* ========================================================= */}
      {/* 1. INSTAGRAM POST HEADER                                  */}
      {/* ========================================================= */}
      <header className="h-14 w-full px-3.5 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with colorful Instagram Story gradient border */}
          <div className="p-[1.5px] rounded-full bg-linear-to-tr border-1 border-sky-300 flex-shrink-0">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-white flex items-center justify-center">
              {authorPhoto && !authorPhotoError ? (
                <Image
                  src={authorPhoto}
                  alt={authorName}
                  width={32}
                  height={32}
                  unoptimized
                  referrerPolicy="no-referrer"
                  onError={() => setAuthorPhotoError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image src="/image/logo.png" alt="logo" width={32} height={32} />
              )}
            </div>
          </div>

          {/* User information */}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs sm:text-[13px] text-zinc-900 leading-tight truncate hover:underline cursor-pointer">
              {authorName}
            </span>
            <span className="text-[10px] text-zinc-500 leading-tight">
              Emerge Literature Club • YCCE
            </span>
          </div>
        </div>

        {/* Header Right: Status Tag or 3-Dots Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status && status !== "approved" && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${
                status === "rejected"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === "rejected" ? "bg-red-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <span>{status}</span>
            </span>
          )}

          {/* More Options (...) Button */}
          <button
            type="button"
            onClick={() => setShowOptionsModal(true)}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 active:scale-95 transition-transform cursor-pointer"
            aria-label="Post options"
            title="Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MEDIA / IMAGE SECTION (EDGE-TO-EDGE ON MOBILE)        */}
      {/* ========================================================= */}
      {image ? (
        <div
          className="relative w-full bg-zinc-950/5 flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={handleImageTouch}
        >
          <img
            src={image}
            alt="Shayari artwork"
            loading="eager"
            decoding="async"
            className="w-full h-auto max-h-[580px] object-cover sm:object-contain select-none"
          />

          {/* Double-tap animated heart pop */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-50 duration-200">
              <HeartIcon className="w-24 h-24 text-white fill-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-bounce" />
            </div>
          )}
        </div>
      ) : (
        /* Text-only shayari canvas (Instagram poetry slide style) */
        <div
          className="relative w-full aspect-square sm:aspect-4/3 bg-linear-to-b from-[#faf8f4] via-[#f7f2ea] to-[#f2eae0] border-y border-[#e8ded0] p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none"
          onClick={handleImageTouch}
        >
          <Feather className="w-6 h-6 text-amber-700/40 mb-3" />
          <div className="text-zinc-800 text-sm sm:text-base leading-relaxed font-serif max-w-xs sm:max-w-sm whitespace-pre-line">
            {renderFormattedText(caption)}
          </div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-800/60 mt-4">
            ~ {authorName}
          </span>

          {/* Double tap heart for text post */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-50 duration-200">
              <HeartIcon className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-md animate-bounce" />
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INSTAGRAM ACTION BAR (Directly below photo)           */}
      {/* ========================================================= */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          {/* Like Heart Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isProcessingLike}
            aria-label={isLiked ? "Unlike" : "Like"}
            className="cursor-pointer transition-transform active:scale-125 focus:outline-none disabled:opacity-70 flex items-center justify-center"
            title={isLiked ? "Unlike" : "Like"}
          >
            <HeartIcon
              className={`w-6 h-6 transition-colors ${
                isLiked
                  ? "fill-rose-500 text-rose-500 animate-in zoom-in-75 duration-150"
                  : "text-zinc-800 hover:text-zinc-600"
              }`}
            />
          </button>

          {/* Comment Bubble Button */}
          {/* <button
            type="button"
            onClick={() => setCaptionExpanded(true)}
            className="cursor-pointer text-zinc-800 hover:text-zinc-600 active:scale-125 transition-transform flex items-center justify-center"
            aria-label="Comment on Sher"
            title="Read Discussion"
          >
            <MessageCircle className="w-6 h-6" />
          </button> */}

          {/* Share / Paper Plane Button */}
          <button
            type="button"
            onClick={handleShare}
            className="cursor-pointer text-zinc-800 hover:text-sky-500 active:scale-125 transition-transform relative flex items-center justify-center"
            aria-label="Share Sher"
            title="Share Sher"
          >
            {copied ? (
              <Check className="w-6 h-6 text-emerald-500" />
            ) : (
              <Send className="w-6 h-6 -rotate-12" />
            )}
          </button>
        </div>

        {/* Bookmark / Ribbon Save Button */}
        <div>
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={isProcessingBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Save post"}
            className="cursor-pointer transition-transform active:scale-125 focus:outline-none disabled:opacity-70 flex items-center justify-center"
            title={isBookmarked ? "Saved" : "Save"}
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                isBookmarked
                  ? "fill-zinc-900 text-zinc-900"
                  : "text-zinc-800 hover:text-zinc-600"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. LIKES COUNTER (INSTAGRAM STYLE: "X likes")            */}
      {/* ========================================================= */}
      <div className="px-3.5 pt-1 text-xs sm:text-[13px] font-bold text-zinc-900 select-none">
        {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
      </div>

      {/* ========================================================= */}
      {/* 5. CAPTION & INLINE USERNAME (INSTAGRAM STYLE)           */}
      {/* ========================================================= */}
      {caption && (
        <div className="px-3.5 pt-1 text-xs sm:text-[13px] text-zinc-800 leading-snug break-words">
          {/* <span className="font-bold text-zinc-900 mr-2 hover:underline cursor-pointer">
            {authorName}
          </span> */}
          <span className="whitespace-pre-line font-normal">
            {showTruncated
              ? renderFormattedText(caption.slice(0, 110))
              : renderFormattedText(caption)}
          </span>
          {isLongCaption && (
            <button
              type="button"
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="text-zinc-400 hover:text-zinc-600 font-medium text-xs ml-1 cursor-pointer select-none"
            >
              {captionExpanded ? " less" : "... more"}
            </button>
          )}
        </div>
      )}

      {/* Copied Feedback Toast */}
      {copied && (
        <div className="px-3.5 pt-1">
          <span className="text-[11px] font-semibold text-emerald-600">
            ✓ Post link copied to clipboard
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TIMESTAMP (BOTTOM)                                     */}
      {/* ========================================================= */}
      <div className="px-3.5 pt-1.5 pb-3">
        <time className="block text-[10px] text-zinc-400 uppercase tracking-wider font-normal">
          {formattedDate || "JUST NOW"}
        </time>
      </div>

      {/* ========================================================= */}
      {/* 7. INSTAGRAM OPTIONS BOTTOM SHEET / MODAL                 */}
      {/* ========================================================= */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-2xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl text-center divide-y divide-gray-100">
            {/* Share Link Option */}
            <button
              type="button"
              onClick={() => {
                setShowOptionsModal(false);
                handleShare();
              }}
              className="w-full py-3.5 px-4 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-sky-500" />
              <span>Share to...</span>
            </button>

            {/* Copy Link Option */}
            <button
              type="button"
              onClick={() => {
                setShowOptionsModal(false);
                handleShare();
              }}
              className="w-full py-3.5 px-4 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-zinc-500" />
              <span>Copy Link</span>
            </button>

            {/* Delete Option (only for post owner) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  setShowOptionsModal(false);
                  setShowDeleteModal(true);
                }}
                className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete Post</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-3.5 px-4 text-xs sm:text-sm font-medium text-zinc-500 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL                              */}
      {/* ========================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-xl text-left">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-800">
              Delete this Post?
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              This action cannot be undone. Your poem, artwork, and associated interactions will be permanently removed.
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default SherCard;