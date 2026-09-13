"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/config/supabase";
import { useLenis } from "@/utils/lenis";
import Footer from "../../components/reuseable/reusable-home/Footer";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Sparkles,
  Trophy,
  Camera,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  Medal,
  User,
  Share2,
  Check,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface MemoryDetail {
  id: number;
  title: string;
  description: string;
  event_date: string | null;
  type: "event" | "competition";
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface MemoryPhoto {
  id: number;
  memory_id: number;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface MemoryWinner {
  id: number;
  memory_id: number;
  name: string;
  position: string | null;
  image_url: string | null;
  description: string | null;
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "Date to be announced";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MemoryDetailPage() {
  useLenis();
  const params = useParams();
  const router = useRouter();

  const memoryId = params?.id ? Number(params.id) : null;

  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [winners, setWinners] = useState<MemoryWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchMemoryDetail = useCallback(async () => {
    if (!memoryId || isNaN(memoryId)) {
      setError("Invalid memory identifier.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch memory record
      const { data: memoryData, error: memoryErr } = await supabase
        .from("memories")
        .select("*")
        .eq("id", memoryId)
        .maybeSingle();

      if (memoryErr) throw memoryErr;
      if (!memoryData) {
        setError("Memory not found. It may have been removed or updated.");
        setLoading(false);
        return;
      }

      setMemory(memoryData);

      // 2. Fetch gallery photos
      const { data: photosData } = await supabase
        .from("memory_photos")
        .select("*")
        .eq("memory_id", memoryId)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      setPhotos(photosData || []);

      // 3. If competition, fetch winners
      if (memoryData.type === "competition") {
        const { data: winnersData } = await supabase
          .from("memory_winners")
          .select("*")
          .eq("memory_id", memoryId)
          .order("id", { ascending: true });

        setWinners(winnersData || []);
      } else {
        setWinners([]);
      }
    } catch (err: any) {
      console.error("Error loading memory detail:", err);
      setError("Unable to load memory details. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [memoryId]);

  useEffect(() => {
    fetchMemoryDetail();
  }, [fetchMemoryDetail]);

  // Combined gallery for lightbox (cover photo + gallery photos)
  const allLightboxImages = useMemo(() => {
    const list: { url: string; caption: string | null }[] = [];
    if (memory?.cover_image_url) {
      list.push({ url: memory.cover_image_url, caption: `${memory.title} - Cover` });
    }
    photos.forEach((p) => {
      list.push({ url: p.image_url, caption: p.caption || memory?.title || null });
    });
    return list;
  }, [memory, photos]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : allLightboxImages.length - 1
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < allLightboxImages.length - 1 ? prev + 1 : 0
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, allLightboxImages]);

  const handleShare = async () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://emergeycce.club";
    const shareUrl = `${origin}/memories/${memoryId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: memory?.title || "Emerge Memories",
          text: memory?.description || "Check out this memory from Emerge Literature Club",
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("Clipboard write failed");
    }
  };

  const isCompetition = memory?.type === "competition";

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
    >
      <div className="w-full flex flex-col items-center pt-24 pb-16 px-4">
        {/* Navigation Breadcrumb */}
        <div className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-between">
          <Link
            href="/memories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Memories Archive</span>
          </Link>

          {memory && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Share Memory</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-xs text-gray-400 font-medium">
              Loading memory details...
            </p>
          </div>
        ) : error || !memory ? (
          <div className="py-20 px-6 text-center max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-800 mb-1">
              Memory Unavailable
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              {error || "This memory entry could not be retrieved."}
            </p>
            <Link
              href="/memories"
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Return to Archive
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-5xl mx-auto space-y-12">
            {/* Header Hero Card */}
            <div
              className={`border-2 p-6 sm:p-8 rounded-3xl bg-white shadow-xs ${
                isCompetition ? "border-amber-200/80" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Cover Image */}
                {memory.cover_image_url && (
                  <div
                    onClick={() => setLightboxIndex(0)}
                    className="w-full lg:w-96 h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-100 relative flex-shrink-0 cursor-pointer group shadow-xs"
                  >
                    <Image
                      src={memory.cover_image_url}
                      alt={memory.title}
                      fill
                      unoptimized={memory.cover_image_url.startsWith("http")}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>View Photo</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Info Column */}
                <div className="flex-1 space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isCompetition ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-xs">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Competition Event</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Club Gathering</span>
                      </span>
                    )}

                    {memory.event_date ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span>{formatDisplayDate(memory.event_date)}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Date to be announced</span>
                      </div>
                    )}

                    {photos.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                        <Camera className="w-3.5 h-3.5 text-sky-500" />
                        <span>{photos.length} Photos in Gallery</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-800 leading-tight">
                    {memory.title}
                  </h1>

                  {/* Description */}
                  <p className="text-sm sm:text-base leading-relaxed text-zinc-600 whitespace-pre-line">
                    {memory.description}
                  </p>
                </div>
              </div>
            </div>

            {/* ================= COMPETITION WINNERS SECTION ================= */}
            {isCompetition && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-amber-200/90 shadow-xs relative overflow-hidden"
              >
                {/* Subtle trophy watermark */}
                <Trophy className="absolute -right-8 -bottom-8 w-44 h-44 text-amber-50/70 pointer-events-none -rotate-12" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-amber-100">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Medal className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-800">
                        Honorable Winners &amp; Champions
                      </h2>
                      <p className="text-xs text-gray-500">
                        Recognizing exceptional performances, spoken word, and poetic mastery.
                      </p>
                    </div>
                  </div>

                  {winners.length === 0 ? (
                    <div className="py-12 px-6 text-center bg-amber-50/40 border border-amber-200/60 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-800 mb-1">
                        Winner Details Forthcoming
                      </h3>
                      <p className="text-xs text-amber-800/80 max-w-sm mx-auto leading-relaxed">
                        Winner details will be announced soon.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {winners.map((winner, idx) => (
                        <div
                          key={winner.id}
                          className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs flex flex-col items-center text-center hover:border-amber-300 transition-colors"
                        >
                          {/* Winner Portrait */}
                          <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-50 border-2 border-amber-300 relative mb-3 shadow-xs">
                            {winner.image_url ? (
                              <Image
                                src={winner.image_url}
                                alt={winner.name}
                                fill
                                unoptimized={winner.image_url.startsWith("http")}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-400">
                                <User className="w-10 h-10" />
                              </div>
                            )}
                          </div>

                          {/* Position Badge */}
                          {winner.position && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold mb-1.5">
                              <Trophy className="w-3 h-3 text-amber-600" />
                              <span>{winner.position}</span>
                            </span>
                          )}

                          {/* Winner Name */}
                          <h3 className="text-base font-bold text-zinc-800">
                            {winner.name}
                          </h3>

                          {/* Description / Citation */}
                          {winner.description && (
                            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
                              {winner.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* ================= PHOTO GALLERY ================= */}
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-800">
                    Photo Gallery
                  </h2>
                </div>

                <span className="text-xs font-semibold text-gray-400">
                  {photos.length} Captured Moments
                </span>
              </div>

              {photos.length === 0 ? (
                <div className="py-16 px-6 text-center bg-white border border-gray-200 rounded-2xl">
                  <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">
                    Additional gallery photographs for this memory will be published soon.
                  </p>
                </div>
              ) : (
                /* Masonry-Style Column Gallery */
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                  {photos.map((photo, index) => {
                    const actualLightboxIdx = memory.cover_image_url ? index + 1 : index;

                    return (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.4 }}
                        onClick={() => setLightboxIndex(actualLightboxIdx)}
                        className="break-inside-avoid rounded-2xl overflow-hidden border border-gray-200 bg-white group cursor-pointer shadow-xs hover:shadow-md transition-all duration-300"
                      >
                        <div className="relative w-full overflow-hidden bg-gray-100">
                          <img
                            src={photo.image_url}
                            alt={photo.caption || memory.title}
                            loading="lazy"
                            className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
                          />

                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                            <span className="text-white text-xs font-medium bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                              Expand Photo
                            </span>
                          </div>
                        </div>

                        {photo.caption && (
                          <div className="p-3 text-xs text-zinc-600 bg-white border-t border-gray-100 leading-snug">
                            {photo.caption}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= LIGHTBOX MODAL ================= */}
        <AnimatePresence>
          {lightboxIndex !== null && allLightboxImages[lightboxIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxIndex(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 select-none"
            >
              {/* Modal Container */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Counter */}
                <div className="absolute -top-10 left-0 text-xs font-semibold text-white/70">
                  {lightboxIndex + 1} / {allLightboxImages.length}
                </div>

                {/* Active Image */}
                <div className="relative w-full h-[65vh] sm:h-[75vh] flex items-center justify-center">
                  <img
                    src={allLightboxImages[lightboxIndex].url}
                    alt="Expanded view"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  />
                </div>

                {/* Caption Bar */}
                {allLightboxImages[lightboxIndex].caption && (
                  <p className="mt-3 text-xs sm:text-sm text-white/80 text-center max-w-xl">
                    {allLightboxImages[lightboxIndex].caption}
                  </p>
                )}

                {/* Prev Button */}
                {allLightboxImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : allLightboxImages.length - 1
                      );
                    }}
                    className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Next Button */}
                {allLightboxImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) =>
                        prev !== null && prev < allLightboxImages.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
