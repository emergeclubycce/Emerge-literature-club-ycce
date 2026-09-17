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
  Layers,
  Feather,
} from "lucide-react";

import { fetchPostEngagement } from "@/utils/engagement";
import { getAvatarFromUser, getNameFromUser } from "@/utils/profile";

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
  status?: "pending" | "approved" | "rejected";
  idx: number;
  likeCount: number;
  bookmarkCount: number;
}

export default function ProfileHistoryPage() {
  useLenis();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"likes" | "bookmarks" | "submissions">("likes");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [posts, setPosts] = useState<HistorySher[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<number>>(new Set());
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);

  // Initialize active tab from query parameter if provided (?tab=submissions)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "likes" || tab === "bookmarks" || tab === "submissions") {
        setActiveTab(tab);
      }
    }
  }, []);

  // 1. Authenticate user on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          if (authError?.message?.toLowerCase().includes("refresh token")) {
            await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          }
          if (isMounted) router.push("/auth/login");
          return;
        }

        if (isMounted) {
          setCurrentUser(authData.user);
          setAuthChecking(false);
        }
      } catch (err) {
        console.warn("Auth check error:", err);
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

      // Fetch user's current likes and bookmarks sets, and total submission count in parallel
      const [allLikesRes, allBookmarksRes, subCountRes] = await Promise.all([
        supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id),
        supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", currentUser.id),
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
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
      setSubmissionCount(subCountRes.count ?? 0);

      // Branch: "submissions" tab (My Submissions)
      if (activeTab === "submissions") {
        const { data: postsData, error: postsErr, count: totalCount } = await supabase
          .from("posts")
          .select("id, user_id, content, image_url, created_at, status", { count: "exact" })
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (postsErr) throw postsErr;

        if (totalCount !== null && totalCount !== undefined) {
          setSubmissionCount(totalCount);
        } else {
          setSubmissionCount(postsData?.length ?? 0);
        }

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          setLoadingPosts(false);
          return;
        }

        const postIds = postsData.map((p) => p.id);

        // Fetch engagement for posts & current user's profile info
        const [engagementMap, profileRes] = await Promise.all([
          fetchPostEngagement(postIds),
          supabase
            .from("profiles")
            .select("user_id, name, photo_url")
            .eq("user_id", currentUser.id)
            .maybeSingle(),
        ]);

        const authorName =
          profileRes.data?.name?.trim() ||
          getNameFromUser(currentUser) ||
          "You";

        const authorPhoto =
          profileRes.data?.photo_url?.trim() ||
          getAvatarFromUser(currentUser) ||
          null;

        const formatted: HistorySher[] = postsData.map((p, ind) => {
          const engagement = engagementMap[p.id] || { likes: 0, bookmarks: 0 };
          return {
            id: p.id,
            userId: p.user_id,
            caption: p.content,
            image: p.image_url,
            writter: authorName,
            authorPhoto: authorPhoto,
            createdAt: p.created_at,
            status: p.status as "pending" | "approved" | "rejected",
            idx: ind,
            likeCount: engagement.likes,
            bookmarkCount: engagement.bookmarks,
          };
        });

        setPosts(formatted);
        return;
      }

      // Branch: "likes" or "bookmarks" tab
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
        .select("id, user_id, content, image_url, created_at, status")
        .in("id", targetPostIds)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (postsErr) throw postsErr;

      const postIds = (postsData || []).map((p) => p.id);

      // Fetch author profiles and engagement counts in parallel
      const userIds = [
        ...new Set((postsData || []).map((p) => p.user_id).filter(Boolean)),
      ];

      let profilesMap: Record<string, { name?: string; photo_url?: string }> = {};

      const [profilesRes, engagementMap] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from("profiles")
              .select("user_id, name, photo_url")
              .in("user_id", userIds)
          : Promise.resolve({ data: [] }),
        fetchPostEngagement(postIds),
      ]);

      if (profilesRes.data) {
        profilesRes.data.forEach((pr: any) => {
          profilesMap[pr.user_id] = pr;
        });
      }

      const formatted: HistorySher[] = (postsData || []).map((p, ind) => {
        const authorProfile = p.user_id ? profilesMap[p.user_id] : null;
        const displayAuthor = authorProfile?.name?.trim() || "Anonymous";

        const authorPhoto =
          authorProfile?.photo_url?.trim() ||
          (p.user_id && p.user_id === currentUser?.id
            ? getAvatarFromUser(currentUser)
            : null) ||
          null;

        const engagement = engagementMap[p.id] || { likes: 0, bookmarks: 0 };

        return {
          id: p.id,
          userId: p.user_id,
          caption: p.content,
          image: p.image_url,
          writter: displayAuthor,
          authorPhoto: authorPhoto,
          createdAt: p.created_at,
          idx: ind,
          likeCount: engagement.likes,
          bookmarkCount: engagement.bookmarks,
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
            Revisit your favorite verses, poetry lines, and view all your submitted Shayari.
          </p>

          {/* Activity Tabs */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("likes")}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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

            <button
              type="button"
              onClick={() => setActiveTab("submissions")}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "submissions"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-white text-zinc-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Feather
                className={`w-4 h-4 ${
                  activeTab === "submissions" ? "text-white" : "text-sky-500"
                }`}
              />
              <span>My Submissions</span>
              {submissionCount !== null && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    activeTab === "submissions"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {submissionCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* My Submissions Header (Displays count & Write Shayari action) */}
        {activeTab === "submissions" && !loadingPosts && !error && (
          <div className="w-full max-w-7xl mx-auto mb-6 flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-700">
                My Submissions
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {submissionCount ?? posts.length}{" "}
                {(submissionCount ?? posts.length) === 1
                  ? "submission"
                  : "submissions"}
              </p>
            </div>

            <Link
              href="/shers/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Write Shayari</span>
            </Link>
          </div>
        )}

        {/* Content Feed */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          {loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">
                Loading your {activeTab === "submissions" ? "submissions" : activeTab}...
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
                ) : activeTab === "bookmarks" ? (
                  <Bookmark className="w-6 h-6" />
                ) : (
                  <Feather className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-700">
                {activeTab === "likes"
                  ? "No Liked Shayari Yet"
                  : activeTab === "bookmarks"
                  ? "No Bookmarked Shayari Yet"
                  : "You haven't submitted any Shayari yet"}
              </h3>
              <p className="text-xs text-gray-400 mt-1 mb-5">
                {activeTab === "likes"
                  ? "When you tap the heart on any Shayari post, it will be saved here for you."
                  : activeTab === "bookmarks"
                  ? "Save your favorite verses to read anytime later by tapping the bookmark icon."
                  : "Share your verses, couplets, and poetry with the Emerge community."}
              </p>
              <Link
                href={activeTab === "submissions" ? "/shers/submit" : "/shers"}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
              >
                {activeTab === "submissions" ? (
                  <>
                    <Feather className="w-4 h-4" />
                    <span>Write Shayari</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Explore Shayari Feed</span>
                  </>
                )}
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
                    status={val.status}
                    idx={val.idx}
                    userId={val.userId}
                    currentUserId={currentUser?.id ?? null}
                    initialLiked={likedPostIds.has(val.id)}
                    initialBookmarked={bookmarkedPostIds.has(val.id)}
                    likeCount={val.likeCount}
                    bookmarkCount={val.bookmarkCount}
                    onDelete={(deletedId) => {
                      setPosts((prev) => prev.filter((p) => p.id !== deletedId));
                      if (activeTab === "submissions") {
                        setSubmissionCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
                      }
                    }}
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
