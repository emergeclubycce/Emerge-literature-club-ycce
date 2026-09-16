"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import SherCard from "../components/reuseable/reusable-home/sher-card";
import { useLenis } from "@/utils/lenis";
import Footer from "../components/reuseable/reusable-home/Footer";
import supabase from "@/config/supabase";
import { Feather, Loader2, Plus, Sparkles } from "lucide-react";
import { fetchPostEngagement } from "@/utils/engagement";
import { getAvatarFromUser } from "@/utils/profile";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface DisplaySher {
  id: number;
  userId: string | null;
  caption: string;
  image: string | null;
  writter: string;
  authorPhoto: string | null;
  createdAt: string;
  idx: number;
  likeCount: number;
  bookmarkCount: number;
}

export default function ShersPage() {
  useLenis();

  const [posts, setPosts] = useState<DisplaySher[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError && authError.message?.toLowerCase().includes("refresh token")) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      }
      const loggedUser = authData?.user || null;
      setCurrentUser(loggedUser);

      // Fetch only approved posts ordered by newest first
      const { data: postsData, error: postsErr } = await supabase
        .from("posts")
        .select("id, user_id, author_name, content, image_url, created_at, status")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (postsErr) throw postsErr;

      // Extract post IDs for batch queries
      const postIds = (postsData || []).map((p) => p.id);

      // Fetch corresponding author profiles
      const userIds = [
        ...new Set((postsData || []).map((p) => p.user_id).filter(Boolean)),
      ];

      let profilesMap: Record<string, { name?: string; photo_url?: string }> =
        {};

      // Batch fetch author profiles and total engagement counts in parallel
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

      // Batch fetch current user's personal likes & bookmarks
      let userLikesSet = new Set<number>();
      let userBookmarksSet = new Set<number>();

      if (loggedUser && postIds.length > 0) {
        const [likesRes, bookmarksRes] = await Promise.all([
          supabase
            .from("likes")
            .select("post_id")
            .eq("user_id", loggedUser.id)
            .in("post_id", postIds),
          supabase
            .from("bookmarks")
            .select("post_id")
            .eq("user_id", loggedUser.id)
            .in("post_id", postIds),
        ]);

        if (likesRes.data) {
          userLikesSet = new Set(
            likesRes.data.map((row: any) => Number(row.post_id))
          );
        }
        if (bookmarksRes.data) {
          userBookmarksSet = new Set(
            bookmarksRes.data.map((row: any) => Number(row.post_id))
          );
        }
      }

      setLikedPostIds(userLikesSet);
      setBookmarkedPostIds(userBookmarksSet);

      const formatted: DisplaySher[] = (postsData || []).map((p, ind) => {
        // Author resolution architecture:
        // 1. public.profiles.name via posts.user_id
        // 2. legacy posts.author_name fallback
        // 3. fallback "Anonymous"
        const authorProfile = p.user_id ? profilesMap[p.user_id] : null;
        const displayAuthor =
          authorProfile?.name?.trim() ||
          p.author_name?.trim() ||
          "Anonymous";

        const authorPhoto =
          authorProfile?.photo_url?.trim() ||
          (p.user_id && p.user_id === loggedUser?.id
            ? getAvatarFromUser(loggedUser)
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
      console.error("Error fetching approved shers:", err);
      setError(
        "Unable to load the Shayari feed right now. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedPosts();

    // Listen for auth state changes to update likes/bookmarks
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchApprovedPosts();
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchApprovedPosts]);

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
    >
      <div className="w-full flex flex-col items-center pt-24 pb-16 px-4">
        {/* Header section */}
        <div className="text-center max-w-xl mb-8">
          <h1 className="text-4xl sm:text-5xl text-gray-600 font-bold tracking-tight">
            Sher-Shayari
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-2">
            Words that breathe, emotions that unfold. Explore original verses
            from the community of Emerge Literature Club.
          </p>

          {/* Action: Add Shayari button */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/shers/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-sm font-medium rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Feather className="w-4 h-4" />
              <span>Write Shayari</span>
            </Link>
          </div>
        </div>

        {/* Content feed - Responsive Pinterest-style Masonry Layout */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">
                Loading verses...
              </p>
            </div>
          ) : error ? (
            <div className="py-16 text-center max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto bg-white border-2 border-gray-200 rounded-2xl flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-700">
                No Published Shayari Yet
              </h3>
              <p className="text-xs text-gray-400 mt-1 mb-5">
                Be the first to share your thoughts and poetic lines with the club.
              </p>
              <Link
                href="/shers/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Submit the First Shayari</span>
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
                    initialLiked={typeof val.id === "number" ? likedPostIds.has(val.id) : false}
                    initialBookmarked={typeof val.id === "number" ? bookmarkedPostIds.has(val.id) : false}
                    likeCount={val.likeCount}
                    bookmarkCount={val.bookmarkCount}
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