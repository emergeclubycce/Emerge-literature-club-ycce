"use client";

import { logger } from "@/utils/logger";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import SherCard from "../components/reuseable/reusable-home/sher-card";
import { useLenis } from "@/utils/lenis";
import Footer from "../components/reuseable/reusable-home/Footer";
import supabase from "@/config/supabase";
import {
  ChevronLeft,
  ChevronRight,
  Feather,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  fetchPostEngagement,
  fetchPostReactions,
  createEmptyPostReactionsData,
  type PostReactionsData,
} from "@/utils/engagement";
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
  authorInstagram?:string | null;
  reactions?: PostReactionsData;
}

const PAGE_SIZE = 20;

function getPaginationItems(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

function ShersContent() {
  const scrollTo = useLenis();

  const searchParams = useSearchParams();
  const router = useRouter();

  // Read current page from URL with fallback to 1 for missing/invalid values (?page=0, ?page=-1, ?page=abc)
  const rawPage = searchParams.get("page");
  let currentPage = 1;
  if (rawPage !== null) {
    const parsed = parseInt(rawPage, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      currentPage = parsed;
    }
  }

  useEffect(() => {
    scrollTo(0);
  }, [currentPage, scrollTo]);

  const [posts, setPosts] = useState<DisplaySher[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<number>>(
    new Set()
  );
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedPosts = useCallback(
    async (pageNumber: number) => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current authenticated user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (
          authError &&
          authError.message?.toLowerCase().includes("refresh token")
        ) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        }
        const loggedUser = authData?.user || null;
        setCurrentUser(loggedUser);

        // Exact server-side pagination calculation:
        // const PAGE_SIZE = 20;
        // const from = (page - 1) * PAGE_SIZE;
        // const to = from + PAGE_SIZE - 1;
        const from = (pageNumber - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const {
          data: postsData,
          count,
          error: postsErr,
        } = await supabase
          .from("posts")
          .select("*", { count: "exact" })
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (postsErr) throw postsErr;

        // Calculate total pages from Supabase exact count
        const totalCount = count || 0;
        const calculatedTotalPages = Math.ceil(totalCount / PAGE_SIZE);
        setTotalPages(calculatedTotalPages);

        // Empty/Last page handling:
        // If the requested page is greater than the available total pages, handle it safely by redirecting
        if (calculatedTotalPages > 0 && pageNumber > calculatedTotalPages) {
          router.replace(`/shers?page=${calculatedTotalPages}`);
          return;
        } else if (calculatedTotalPages === 0 && pageNumber > 1) {
          router.replace(`/shers?page=1`);
          return;
        }

        // Extract post IDs ONLY from the currently loaded 20 posts for related queries
        const postIds = (postsData || []).map((p) => p.id);

        // Fetch corresponding author profiles for ONLY the currently loaded 20 posts
        const userIds = [
          ...new Set((postsData || []).map((p) => p.user_id).filter(Boolean)),
        ];

        let profilesMap: Record<
          string,
          { name?: string; photo_url?: string }
        > = {};

        // Batch fetch author profiles, total engagement counts, and reaction data in parallel for ONLY these 20 posts
        const [profilesRes, engagementMap, reactionsMap] = await Promise.all([
          userIds.length > 0
            ? supabase
                .from("profiles")
                .select("user_id, name, photo_url")
                .in("user_id", userIds)
            : Promise.resolve({ data: [] }),
          fetchPostEngagement(postIds),
          fetchPostReactions(postIds, loggedUser?.id ?? null),
        ]);

        if (profilesRes.data) {
          profilesRes.data.forEach((pr: any) => {
            profilesMap[pr.user_id] = pr;
          });
        }

        // Batch fetch current user's personal likes & bookmarks for ONLY these 20 posts
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
          const authorProfile = p.user_id ? profilesMap[p.user_id] : null;
          const displayAuthor = authorProfile?.name?.trim() || "Anonymous";

          const authorPhoto =
            authorProfile?.photo_url?.trim() ||
            (p.user_id && p.user_id === loggedUser?.id
              ? getAvatarFromUser(loggedUser)
              : null) ||
            null;

          const engagement = engagementMap[p.id] || {
            likes: 0,
            bookmarks: 0,
          };

          const reactionsData =
            reactionsMap[p.id] || createEmptyPostReactionsData();

          return {
            id: p.id,
            userId: p.user_id,
            caption: p.content,
            image: p.image_url,
            writter: displayAuthor,
            authorPhoto: authorPhoto,
            createdAt: p.created_at,
            idx: from + ind,
            likeCount: engagement.likes,
            bookmarkCount: engagement.bookmarks,
            reactions: reactionsData,
          };
        });

        setPosts(formatted);
      } catch (err: any) {
        logger.error("Error fetching approved shers:", err);
        setError(
          "Unable to load the Shayari feed right now. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchApprovedPosts(currentPage);

    // Listen for auth state changes to update likes/bookmarks
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchApprovedPosts(currentPage);
    });

    return () => listener.subscription.unsubscribe();
  }, [currentPage, fetchApprovedPosts]);

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
    >
      <div className="w-full flex flex-col items-center pt-24 pb-16 px-0 sm:px-4">
        {/* Header section */}
        <div className="text-center max-w-xl mb-8 px-4">
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
            /* ── Skeleton Loader – masonry grid of shimmer cards ── */
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {[
                { hasImage: true,  lines: 2, tall: true  },
                { hasImage: false, lines: 4, tall: false },
                { hasImage: true,  lines: 3, tall: false },
                { hasImage: false, lines: 5, tall: true  },
                { hasImage: true,  lines: 2, tall: false },
                { hasImage: false, lines: 3, tall: false },
                { hasImage: true,  lines: 4, tall: true  },
                { hasImage: false, lines: 2, tall: false },
                { hasImage: true,  lines: 3, tall: false },
              ].map((card, i) => (
                <div
                  key={i}
                  className="break-inside-avoid bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Image placeholder */}
                  {card.hasImage && (
                    <div
                      className={`w-full bg-gray-200 animate-pulse ${card.tall ? "h-52" : "h-36"}`}
                    />
                  )}

                  <div className="p-4 space-y-3">
                    {/* Author row */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse shrink-0" />
                      <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
                      <div className="ml-auto h-3 w-12 rounded bg-gray-100 animate-pulse" />
                    </div>

                    {/* Text lines */}
                    <div className="space-y-2">
                      {Array.from({ length: card.lines }).map((_, li) => (
                        <div
                          key={li}
                          className="h-3 rounded bg-gray-200 animate-pulse"
                          style={{ width: li === card.lines - 1 ? "65%" : "100%" }}
                        />
                      ))}
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="h-3 w-10 rounded bg-gray-100 animate-pulse" />
                      <div className="h-3 w-10 rounded bg-gray-100 animate-pulse" />
                      <div className="ml-auto h-3 w-8 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
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
            <>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-2 space-y-6">
                {posts.map((val, index) => (
                  <div
                    key={val.id}
                    className="break-inside-avoid sher-card-enter"
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
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
                      initialLiked={
                        typeof val.id === "number"
                          ? likedPostIds.has(val.id)
                          : false
                      }
                      initialBookmarked={
                        typeof val.id === "number"
                          ? bookmarkedPostIds.has(val.id)
                          : false
                      }
                      likeCount={val.likeCount}
                      bookmarkCount={val.bookmarkCount}
                      initialReactions={val.reactions}
                      onDelete={(deletedId) => {
                        setPosts((prev) => {
                          const updated = prev.filter((p) => p.id !== deletedId);
                          if (updated.length === 0 && currentPage > 1) {
                            router.replace(`/shers?page=${currentPage - 1}`);
                          }
                          return updated;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>


              {/* Server-Side Pagination Controls */}
              {totalPages >= 1 && (
                <nav
                  aria-label="Shayari pagination"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 mb-4 select-none flex-wrap"
                >
                  {/* Previous Button */}
                  {currentPage <= 1 ? (
                    <button
                      disabled
                      aria-disabled="true"
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100/80 border border-gray-200 rounded-xl cursor-not-allowed opacity-60"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                  ) : (
                    <Link
                      href={`/shers?page=${currentPage - 1}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-95 border border-gray-200 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </Link>
                  )}

                  {/* Page Numbers */}
                  {getPaginationItems(currentPage, totalPages).map(
                    (item, index) => {
                      if (typeof item === "number") {
                        const isActive = item === currentPage;
                        return isActive ? (
                          <span
                            key={`page-${item}`}
                            aria-current="page"
                            className="min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 px-2.5 sm:px-3 flex items-center justify-center text-xs sm:text-sm font-semibold text-white bg-sky-500 rounded-xl shadow-xs"
                          >
                            {item}
                          </span>
                        ) : (
                          <Link
                            key={`page-${item}`}
                            href={`/shers?page=${item}`}
                            prefetch={false}
                            className="min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 px-2.5 sm:px-3 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-95 border border-gray-200 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            {item}
                          </Link>
                        );
                      }

                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="w-6 sm:w-8 h-9 sm:h-10 flex items-center justify-center text-xs sm:text-sm text-gray-400 font-medium select-none"
                        >
                          ...
                        </span>
                      );
                    }
                  )}

                  {/* Next Button */}
                  {currentPage >= totalPages ? (
                    <button
                      disabled
                      aria-disabled="true"
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100/80 border border-gray-200 rounded-xl cursor-not-allowed opacity-60"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      href={`/shers?page=${currentPage + 1}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-95 border border-gray-200 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function ShersPage() {
  return (
    <Suspense
      fallback={
        <main
          className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
        >
          <div className="w-full flex flex-col items-center pt-24 pb-16 px-4">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 w-full max-w-7xl mx-auto mt-8">
              {[true, false, true, false, true, false].map((hasImg, i) => (
                <div
                  key={i}
                  className="break-inside-avoid bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                >
                  {hasImg && <div className="w-full h-40 bg-gray-200 animate-pulse" />}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
                      <div className="h-3 w-4/5 rounded bg-gray-200 animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-gray-200 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Footer />
        </main>
      }
    >
      <ShersContent />
    </Suspense>
  );
}