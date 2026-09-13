"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import supabase from "@/config/supabase";
import SherCard from "@/app/components/reuseable/reusable-home/sher-card";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import { useLenis } from "@/utils/lenis";
import {
  Heart,
  Bookmark,
  ArrowLeft,
  Loader2,
  Sparkles,
  User,
  Shield,
  Layers,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface HistorySher {
  id: number;
  userId: string | null;
  caption: string;
  image: string | null;
  writter: string;
  authorPhoto: string | null;
  createdAt: string;
  idx: number;
}

export default function ProfileHistoryPage() {
  useLenis();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"likes" | "bookmarks">("likes");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [posts, setPosts] = useState<HistorySher[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<number>>(new Set());

  // 1. Authenticate user on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          if (isMounted) router.push("/auth/login");
          return;
        }

        if (isMounted) {
          setCurrentUser(authData.user);
          setAuthChecking(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (isMounted) router.push("/auth/login");
      }
    }

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/auth/login");
      } else {
        setCurrentUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // 2. Fetch Activity Posts based on active tab
  const fetchActivity = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoadingPosts(true);
      setError(null);

      // Fetch user's current likes and bookmarks sets for real-time button states
      const [allLikesRes, allBookmarksRes] = await Promise.all([
        supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id),
        supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", currentUser.id),
      ]);

      const userLikesSet = new Set<number>(
        (allLikesRes.data || []).map((row: any) => Number(row.post_id))
      );
      const userBookmarksSet = new Set<number>(
        (allBookmarksRes.data || []).map((row: any) => Number(row.post_id))
      );

      setLikedPostIds(userLikesSet);
      setBookmarkedPostIds(userBookmarksSet);

      // Target post IDs for the active tab
      const targetPostIds =
        activeTab === "likes"
          ? Array.from(userLikesSet)
          : Array.from(userBookmarksSet);

      if (targetPostIds.length === 0) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      // Query ONLY approved posts matching target IDs
      const { data: postsData, error: postsErr } = await supabase
        .from("posts")
        .select("id, user_id, author_name, content, image_url, created_at, status")
        .in("id", targetPostIds)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (postsErr) throw postsErr;

      // Fetch author profiles for regular user posts
      const userIds = [
        ...new Set((postsData || []).map((p) => p.user_id).filter(Boolean)),
      ];

      let profilesMap: Record<string, { name?: string; photo_url?: string }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, photo_url")
          .in("user_id", userIds);

        if (profilesData) {
          profilesData.forEach((pr) => {
            profilesMap[pr.user_id] = pr;
          });
        }
      }

      const formatted: HistorySher[] = (postsData || []).map((p, ind) => {
        // Author resolution priority:
        // 1. posts.author_name, when it exists (e.g. legacy migrated posts)
        // 2. corresponding profile name
        // 3. fallback "Anonymous"
        const displayAuthor =
          p.author_name?.trim() ||
          profilesMap[p.user_id]?.name ||
          "Anonymous";

        return {
          id: p.id,
          userId: p.user_id,
          caption: p.content,
          image: p.image_url,
          writter: displayAuthor,
          authorPhoto: p.author_name ? null : profilesMap[p.user_id]?.photo_url || null,
          createdAt: p.created_at,
          idx: ind,
        };
      });

      setPosts(formatted);
    } catch (err: any) {
      console.error("Error loading activity:", err);
      setError("Unable to load activity right now. Please try again later.");
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser) {
      fetchActivity();
    }
  }, [currentUser, activeTab, fetchActivity]);

  if (authChecking) {
    return (
      <div
        className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
    >
      <div className="w-full flex flex-col items-center pt-24 pb-16 px-4">
        {/* Navigation Breadcrumb */}
        <div className="w-full max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile Settings</span>
          </Link>

          <Link
            href="/shers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-sky-600 transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Browse All Shers</span>
          </Link>
        </div>

        {/* Header section */}
        <div className="text-center max-w-xl mb-8">
          <h1 className="text-3xl sm:text-4xl text-gray-600 font-bold tracking-tight">
            Your Activity
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Revisit your favorite verses, poetry lines, and saved literary moments.
          </p>

          {/* Activity Tabs */}
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("likes")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "likes"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-white text-zinc-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  activeTab === "likes" ? "fill-white" : "text-rose-500"
                }`}
              />
              <span>Likes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bookmarks")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "bookmarks"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-white text-zinc-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  activeTab === "bookmarks" ? "fill-white" : "text-sky-500"
                }`}
              />
              <span>Bookmarks</span>
            </button>
          </div>
        </div>

        {/* Content Feed */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          {loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">
                Loading your {activeTab}...
              </p>
            </div>
          ) : error ? (
            <div className="py-16 text-center max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto bg-white border-2 border-gray-200 rounded-2xl flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  activeTab === "likes"
                    ? "bg-rose-50 text-rose-500"
                    : "bg-sky-50 text-sky-500"
                }`}
              >
                {activeTab === "likes" ? (
                  <Heart className="w-6 h-6" />
                ) : (
                  <Bookmark className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-700">
                No {activeTab === "likes" ? "Liked" : "Bookmarked"} Shayari Yet
              </h3>
              <p className="text-xs text-gray-400 mt-1 mb-5">
                {activeTab === "likes"
                  ? "When you tap the heart on any Shayari post, it will be saved here for you."
                  : "Save your favorite verses to read anytime later by tapping the bookmark icon."}
              </p>
              <Link
                href="/shers"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Shayari Feed</span>
              </Link>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {posts.map((val) => (
                <div key={val.id} className="break-inside-avoid">
                  <SherCard
                    id={val.id}
                    writter={val.writter}
                    image={val.image}
                    caption={val.caption}
                    authorPhoto={val.authorPhoto}
                    createdAt={val.createdAt}
                    idx={val.idx}
                    userId={val.userId}
                    currentUserId={currentUser?.id ?? null}
                    initialLiked={likedPostIds.has(val.id)}
                    initialBookmarked={bookmarkedPostIds.has(val.id)}
                    onDelete={(deletedId) =>
                      setPosts((prev) => prev.filter((p) => p.id !== deletedId))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
