"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Bookmark, HeartIcon, Send, Check, Trash2, AlertTriangle, Loader2 } from "lucide-react";
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

  // If initialLiked or initialBookmarked are not passed (e.g. standalone Share page), fetch for current user
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

  // Fetch engagement counts if not passed via props (e.g. standalone Share page)
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

    // Ignore static home-page cards without a valid numeric post ID
    if (!numericPostId) return;

    if (isProcessingLike) return;

    // Check authenticated user
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
    setIsLiked(nextLiked); // Optimistic update
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
      console.error("Failed to update like status:", err);
      setIsLiked(!nextLiked); // Revert on failure
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsProcessingLike(false);
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async () => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    // Ignore static home-page cards without a valid numeric post ID
    if (!numericPostId) return;

    if (isProcessingBookmark) return;

    // Check authenticated user
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
    setIsBookmarked(nextBookmarked); // Optimistic update
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
      console.error("Failed to update bookmark status:", err);
      setIsBookmarked(!nextBookmarked); // Revert on failure
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
        console.log("Share cancelled", error);
      }
    }

    // Graceful fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("Clipboard copy failed");
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
      if (onDelete) {
        onDelete(numericPostId);
      } else {
        router.push("/shers");
      }
    } catch (err: any) {
      console.error("Failed to delete post:", err);
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

  return (
    <div className="h-auto border-2 px-2 py-1 rounded-2xl bg-white border-gray-200 w-full max-w-md mx-auto shadow-xs relative">
      {/* Header */}
      <div className="h-15 w-full p-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center flex-shrink-0">
            {authorPhoto && !authorPhotoError ? (
              <Image
                src={authorPhoto}
                alt={authorName}
                width={40}
                height={40}
                unoptimized
                referrerPolicy="no-referrer"
                onError={() => setAuthorPhotoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image src="/image/logo.png" alt="logo" width={40} height={40} />
            )}
          </div>
          <div>
            <p className={`${inter.className} font-medium text-sm text-zinc-800`}>
              {authorName}
            </p>
            <p className="text-[11px] text-gray-400">
              Emerge Literature Club | YCCE
            </p>
          </div>
        </div>

        {/* Right header controls */}
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                status === "approved"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : status === "rejected"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === "approved"
                    ? "bg-emerald-500"
                    : status === "rejected"
                    ? "bg-red-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="capitalize">{status}</span>
            </span>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete your Shayari"
              aria-label="Delete your Shayari"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="h-full flex flex-col items-center justify-center gap-[3px]">
            <div className="h-1 w-1 bg-gray-300 rounded-2xl"></div>
            <div className="h-1 w-1 bg-gray-300 rounded-2xl"></div>
            <div className="h-1 w-1 bg-gray-300 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-xl text-left">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-800">
              Delete this Shayari?
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

      {/* Image Section (only if image exists) */}
      {image && (
        <div className="h-auto w-full border-gray-300 flex items-center justify-center px-2 py-1 text-center">
          <img
            src={image}
            alt="Shayari artwork"
            className="overflow-hidden rounded-2xl w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Footer */}
      <div className="h-auto w-full px-2 pb-2">
        {status && status !== "approved" ? (
          <div className="w-full py-2.5 px-1 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "pending"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              <span className="text-zinc-700">
                {status === "pending"
                  ? "Awaiting Admin Review"
                  : "Submission Rejected"}
              </span>
            </span>
            <span className="text-[11px] text-gray-400">
              {status === "pending" ? "Pending moderation" : "Not published"}
            </span>
          </div>
        ) : (
          <div className="w-full h-10 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Like Button & Count */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={isProcessingLike}
                  aria-label={isLiked ? "Unlike Shayari" : "Like Shayari"}
                  className="cursor-pointer transition-transform active:scale-125 focus:outline-none disabled:opacity-70 flex items-center justify-center"
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <HeartIcon
                    className={`w-5 h-5 transition-colors ${
                      isLiked
                        ? "fill-rose-500 text-rose-500"
                        : "text-zinc-600 hover:text-rose-400"
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-zinc-600 select-none">
                  {likesCount}
                </span>
              </div>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="cursor-pointer text-zinc-600 hover:text-sky-500 transition-colors relative flex items-center justify-center"
                title="Share Shayari"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
              {copied && (
                <span className="text-[11px] font-medium text-emerald-600">
                  Link copied!
                </span>
              )}
            </div>

            {/* Bookmark Button & Count */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleBookmark}
                disabled={isProcessingBookmark}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark Shayari"}
                className="cursor-pointer transition-transform active:scale-125 focus:outline-none disabled:opacity-70 flex items-center justify-center"
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Bookmark
                  className={`w-5 h-5 transition-colors ${
                    isBookmarked
                      ? "fill-sky-500 text-sky-500"
                      : "text-zinc-600 hover:text-sky-400"
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-zinc-600 select-none">
                {bookmarksCount}
              </span>
            </div>
          </div>
        )}

        {/* Shayari Text / Description (Positioned ABOVE Written by) */}
        {caption && (
          <div className="text-sm text-zinc-700 p-2 whitespace-pre-line leading-relaxed">
            {renderFormattedText(caption)}
          </div>
        )}

        {/* Written by Author Section & Date (Always at the BOTTOM of post content) */}
        <div className="flex items-center justify-between gap-2 mt-2 px-1">
          <div className="Inter text-xs px-2.5 w-fit rounded-2xl py-[3px] outline-dashed outline-[0.5px] outline-zinc-500 bg-slate-100 text-zinc-700">
            Written by {authorName}
          </div>
          {formattedDate && (
            <span className="text-[11px] text-gray-400 font-medium">
              {status ? `Submitted ${formattedDate}` : formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SherCard;