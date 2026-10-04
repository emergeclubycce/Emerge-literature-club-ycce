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
  Sparkles,
  X,
  Instagram,
  Smile,
  Feather,
} from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/config/supabase";
import {
  fetchPostEngagement,
  fetchPostReactions,
  togglePostReaction,
  createEmptyReactionCounts,
  ALLOWED_REACTIONS,
  type ReactionType,
  type PostReactionsData,
} from "@/utils/engagement";
import { deleteShayariPost, renderFormattedText } from "@/utils/posts";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function getReactionAccessibleLabel(emoji: ReactionType): string {
  switch (emoji) {
    case "❤️":
      return "Love reaction";
    case "🔥":
      return "Fire reaction";
    case "🎉":
      return "Celebration reaction";
    case "👏🏻":
      return "Clap reaction";
    case "👍🏻":
      return "Like reaction";
    default:
      return "Reaction";
  }
}

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
  initialReactions?: PostReactionsData;
  currentUserId?: string | null;
  userId?: string | null;
  Authorinstagram?: string | null;
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
  initialReactions,
  currentUserId,
  userId,
  Authorinstagram, 
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

  // Emoji Reactions State
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>(
    initialReactions?.counts ?? createEmptyReactionCounts()
  );
  const [currentUserReaction, setCurrentUserReaction] = useState<ReactionType | null>(
    initialReactions?.userReaction ?? null
  );
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [pickerPosition, setPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [isProcessingReaction, setIsProcessingReaction] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pickerRef = useRef<HTMLDivElement>(null);
  const reactionTriggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  // Instagram-style double tap to like
  const [showHeartPop, setShowHeartPop] = useState<boolean>(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (initialReactions?.counts) {
      setReactionCounts(initialReactions.counts);
    }
    if (initialReactions?.userReaction !== undefined) {
      setCurrentUserReaction(initialReactions.userReaction);
    }
  }, [initialReactions]);

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

  // Fetch reaction data ONLY if not provided via props (standalone cards)
  useEffect(() => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    if (!numericPostId) return;

    if (initialReactions === undefined) {
      fetchPostReactions([numericPostId], effectiveUserId).then((res) => {
        if (res[numericPostId]) {
          setReactionCounts(res[numericPostId].counts);
          setCurrentUserReaction(res[numericPostId].userReaction);
        }
      });
    }
  }, [id, initialReactions, effectiveUserId]);

  // Handle reaction selection (Optimistic UI)
  const handleSelectReaction = async (selectedEmoji: ReactionType) => {
    const numericPostId =
      typeof id === "number"
        ? id
        : typeof id === "string" && !isNaN(Number(id))
        ? Number(id)
        : null;

    if (!numericPostId || isProcessingReaction) return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr && authErr.message?.toLowerCase().includes("refresh token")) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
    const user = authData?.user;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const prevReaction = currentUserReaction;
    const prevCounts = { ...reactionCounts };

    let nextReaction: ReactionType | null = null;
    const nextCounts = { ...reactionCounts };

    if (prevReaction === selectedEmoji) {
      // Toggle off / remove reaction
      nextReaction = null;
      nextCounts[selectedEmoji] = Math.max(0, (nextCounts[selectedEmoji] || 0) - 1);
    } else {
      if (prevReaction) {
        // Replace previous reaction
        nextCounts[prevReaction] = Math.max(0, (nextCounts[prevReaction] || 0) - 1);
      }
      nextReaction = selectedEmoji;
      nextCounts[selectedEmoji] = (nextCounts[selectedEmoji] || 0) + 1;
    }

    setCurrentUserReaction(nextReaction);
    setReactionCounts(nextCounts);
    setIsProcessingReaction(true);

    try {
      const res = await togglePostReaction(
        numericPostId,
        selectedEmoji,
        user.id,
        prevReaction
      );

      if (!res.success) {
        throw res.error || new Error("Reaction update failed");
      }
    } catch (err) {
      logger.error("Failed to update reaction:", err);
      // Revert optimistic state on failure
      setCurrentUserReaction(prevReaction);
      setReactionCounts(prevCounts);
    } finally {
      setIsProcessingReaction(false);
    }
  };

  // Helper to open reaction picker at specific viewport coordinates with intelligent clamping
  const openPickerAt = (clientX: number, clientY: number) => {
    if (typeof window === "undefined") return;
    const pickerWidth = 240;
    const pickerHeight = 52;
    const margin = 12;

    // Center horizontally around the target point
    let x = clientX - pickerWidth / 2;
    // Clamp horizontally to avoid viewport overflow
    if (x < margin) x = margin;
    if (x + pickerWidth > window.innerWidth - margin) {
      x = window.innerWidth - pickerWidth - margin;
    }

    // By default position vertically above clientY
    let y = clientY - pickerHeight - 14;
    // If not enough space above, flip below
    if (y < margin) {
      y = clientY + 16;
    }
    // Clamp vertically so it doesn't go below viewport
    if (y + pickerHeight > window.innerHeight - margin) {
      y = window.innerHeight - pickerHeight - margin;
    }

    setPickerPosition({ x, y });
    setShowReactionPicker(true);
  };

  // Dedicated action bar trigger button handler
  const handleTriggerButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (showReactionPicker) {
      setShowReactionPicker(false);
      return;
    }
    const rect = reactionTriggerRef.current?.getBoundingClientRect();
    if (rect) {
      openPickerAt(rect.left + rect.width / 2, rect.top);
    } else {
      openPickerAt(e.clientX, e.clientY);
    }
  };

  // Close reaction picker on click outside, scroll, or Escape key
  useEffect(() => {
    if (!showReactionPicker) return;

    const handleScroll = () => {
      setShowReactionPicker(false);
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        reactionTriggerRef.current &&
        !reactionTriggerRef.current.contains(target)
      ) {
        setShowReactionPicker(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowReactionPicker(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showReactionPicker]);

  // Clean up press timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Mobile Long Press Handling (450ms)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      isLongPressTriggeredRef.current = false;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        if (touchStartPosRef.current) {
          openPickerAt(touchStartPosRef.current.x, touchStartPosRef.current.y);
        }
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(40);
          } catch {}
        }
      }, 450);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPosRef.current && e.touches.length === 1) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      // Cancel timer if finger moves > 10px (user is scrolling)
      if (dx > 10 || dy > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Slide-to-select support when picker is open
    if (showReactionPicker && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const reactionBtn = targetEl?.closest("[data-reaction-emoji]") as HTMLElement | null;
      if (reactionBtn) {
        const emoji = reactionBtn.getAttribute("data-reaction-emoji") as ReactionType;
        if (emoji && (ALLOWED_REACTIONS as readonly string[]).includes(emoji)) {
          handleSelectReaction(emoji);
          setShowReactionPicker(false);
        }
      }
    }

    touchStartPosRef.current = null;
    if (isLongPressTriggeredRef.current) {
      setTimeout(() => {
        isLongPressTriggeredRef.current = false;
      }, 350);
    }
  };

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
    if (isLongPressTriggeredRef.current) return;
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
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClickCapture={(e) => {
        if (isLongPressTriggeredRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        openPickerAt(e.clientX, e.clientY);
      }}
      className={`${inter.className} w-full max-w-md -mt-5 md:mt-0 mx-auto bg-white border-b border-gray-200/80 sm:border sm:rounded-2xl sm:shadow-xs transition-all relative select-none sm:select-auto`}
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
          {Authorinstagram ? (
            <Link
              href={Authorinstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 active:scale-95 transition-transform cursor-pointer"
            >
              <Instagram size={18} />
            </Link>
          ) : null}
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
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between bg-white relative">
        <div className="flex items-center gap-3 sm:gap-4">
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

          {/* Dedicated Emoji Reaction Trigger Button (Desktop & Mobile) */}
          <button
            ref={reactionTriggerRef}
            type="button"
            onClick={handleTriggerButtonClick}
            aria-label="React with emoji"
            className={`cursor-pointer transition-transform active:scale-125 focus:outline-none flex items-center justify-center p-0.5 rounded-full ${
              currentUserReaction
                ? "text-sky-600 bg-sky-50 ring-1 ring-sky-300"
                : "text-zinc-800 hover:text-zinc-600"
            }`}
            title={
              currentUserReaction
                ? `Reacted with ${currentUserReaction}`
                : "React with emoji"
            }
          >
            {currentUserReaction ? (
              <span className="text-xl leading-none">{currentUserReaction}</span>
            ) : (
              <Smile className="w-6 h-6" />
            )}
          </button>

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
      {/* 4. LIKES COUNTER & COMPACT REACTION BADGES                */}
      {/* ========================================================= */}
      <div className="px-3.5 pt-1 text-xs sm:text-[13px] font-bold text-zinc-900 select-none">
        {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
      </div>

      {/* Compact Reaction Badges */}
      {ALLOWED_REACTIONS.some((emoji) => (reactionCounts[emoji] || 0) > 0) && (
        <div className="px-3.5 pt-1.5 flex flex-wrap items-center gap-1.5 select-none">
          {ALLOWED_REACTIONS.map((emoji) => {
            const count = reactionCounts[emoji] || 0;
            if (count <= 0) return null;
            const isUserReacted = currentUserReaction === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectReaction(emoji)}
                disabled={isProcessingReaction}
                aria-label={`${
                  isUserReacted ? "Remove" : "Add"
                } ${emoji} reaction, total ${count}`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isUserReacted
                    ? "bg-sky-50 text-sky-700 border border-sky-300 shadow-xs scale-105"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-transparent"
                }`}
                title={
                  isUserReacted
                    ? `You reacted with ${emoji} (click to remove)`
                    : `React with ${emoji}`
                }
              >
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-[11px] font-semibold">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CAPTION & INLINE USERNAME (INSTAGRAM STYLE)           */}
      {/* Only shown when there is an image — text-only posts      */}
      {/* already display the content in the poetry canvas above.  */}
      {/* ========================================================= */}
      {caption && image && (
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
      {/* WhatsApp-style Floating Reaction Picker with Framer Motion */}
      {isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showReactionPicker && pickerPosition && (
              <motion.div
                ref={pickerRef}
                role="dialog"
                aria-label="Reaction picker"
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  left: `${pickerPosition.x}px`,
                  top: `${pickerPosition.y}px`,
                  zIndex: 9999,
                }}
                className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 shadow-xl rounded-full px-2 py-1 flex items-center gap-0.5 sm:gap-1 select-none pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {ALLOWED_REACTIONS.map((emoji) => {
                  const isSelected = currentUserReaction === emoji;
                  return (
                    <motion.button
                      key={emoji}
                      type="button"
                      data-reaction-emoji={emoji}
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectReaction(emoji);
                        setShowReactionPicker(false);
                      }}
                      disabled={isProcessingReaction}
                      aria-label={getReactionAccessibleLabel(emoji)}
                      className={`p-1.5 sm:p-2 rounded-full cursor-pointer flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-sky-100 dark:bg-sky-950/60 ring-1.5 ring-sky-400"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="text-xl sm:text-2xl leading-none select-none">
                        {emoji}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </article>
  );
}

export default SherCard;