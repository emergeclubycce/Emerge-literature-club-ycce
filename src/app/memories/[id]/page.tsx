"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bebas_Neue, Playfair_Display, DM_Serif_Display, Cinzel, Newsreader, Inter } from "next/font/google";
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
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  User,
  Share2,
  Check,
  Feather,
  Maximize2,
} from "lucide-react";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

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
  if (!dateStr) return "Archived Date TBA";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    month: "long",
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
      setError("Invalid archive record identifier.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch memory
      const { data: memData, error: memErr } = await supabase
        .from("memories")
        .select("*")
        .eq("id", memoryId)
        .single();

      if (memErr || !memData) {
        throw new Error(memErr?.message || "Memory chronicle could not be located.");
      }
      setMemory(memData);

      // Fetch photos
      const { data: photosData } = await supabase
        .from("memory_photos")
        .select("*")
        .eq("memory_id", memoryId)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      setPhotos(photosData || []);

      // Fetch winners
      if (memData.type === "competition") {
        const { data: winnersData } = await supabase
          .from("memory_winners")
          .select("*")
          .eq("memory_id", memoryId)
          .order("id", { ascending: true });

        setWinners(winnersData || []);
      }
    } catch (err: any) {
      console.error("Failed to load memory detail:", err);
      setError(err?.message || "Unable to load memory details.");
    } finally {
      setLoading(false);
    }
  }, [memoryId]);

  useEffect(() => {
    fetchMemoryDetail();
  }, [fetchMemoryDetail]);

  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-[#f4ebd9] text-[#1c1917]`}
    >
      <div className="w-full max-w-5xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        
        {/* Newspaper Back & Share Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/memories"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#292524] bg-[#faf6ee] text-xs font-bold uppercase tracking-wider text-[#1c1917] hover:bg-[#1c1917] hover:text-[#faf6ee] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&larr; Return to The Emerge Gazette</span>
          </Link>

          {memory && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#292524] bg-[#faf6ee] text-xs font-bold uppercase tracking-wider hover:bg-stone-200 shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Gazette Dispatch</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Paper Sheet Document */}
        <div className="bg-[#faf6ee] border-2 sm:border-[3px] border-[#292524] p-6 sm:p-10 shadow-[0_15px_40px_rgba(41,37,36,0.12)]">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#78350f] animate-spin" />
              <p className={`${newsreader.className} text-base text-[#57534e] italic`}>
                Loading special archive dispatch...
              </p>
            </div>
          ) : error || !memory ? (
            <div className="py-12 px-6 text-center max-w-md mx-auto border-2 border-red-800 bg-[#fef2f2] p-6 my-4">
              <AlertCircle className="w-8 h-8 text-red-700 mx-auto mb-2" />
              <h3 className={`${playfair.className} text-lg font-bold text-red-900`}>
                Archive Document Not Found
              </h3>
              <p className="text-xs text-red-700 mt-1 mb-4">{error || "The requested chronicle could not be located."}</p>
              <Link
                href="/memories"
                className="px-4 py-1.5 bg-[#292524] text-[#faf6ee] text-xs font-bold uppercase tracking-wider hover:bg-black"
              >
                Back to Archives
              </Link>
            </div>
          ) : (
            <article className="space-y-8">
              {/* Masthead Header */}
              <div className="text-center border-b-2 border-[#292524] pb-4">
                <div className="border-t-2 border-b border-[#1c1917] py-1 mb-3">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#44403c] px-1">
                    <span>THE SOCIETY ARCHIVE</span>
                    <span>DISPATCH NO. #{memory.id}</span>
                    <span>{memory.type.toUpperCase()} EDITION</span>
                  </div>
                </div>

                <div className="my-2 py-1 border-y border-[#292524] text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#78350f] flex items-center justify-between">
                  <span>VOL. 19, NO. {memory.id}</span>
                  <span>✱</span>
                  <span>RECORDED: {formatDisplayDate(memory.event_date)}</span>
                  <span>✱</span>
                  <span>YCCE CAMPUS</span>
                </div>

                <h1 className={`${dmSerif.className} text-3xl sm:text-5xl lg:text-6xl font-normal text-[#1c1917] leading-tight mt-3 uppercase`}>
                  {memory.title}
                </h1>
              </div>

              {/* Cover Photo */}
              {memory.cover_image_url && (
                <div className="border-2 border-[#292524] p-1.5 bg-white">
                  <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-stone-200">
                    <Image
                      src={memory.cover_image_url}
                      alt={memory.title}
                      fill
                      priority
                      unoptimized={memory.cover_image_url.startsWith("http") ? true : false}
                      className="object-cover"
                    />
                  </div>
                  <div className="py-1 px-2 border-t border-[#292524] text-[11px] font-bold uppercase tracking-wider text-[#44403c] flex items-center justify-between">
                    <span>ARCHIVE PLATE: {memory.title}</span>
                    <span>YCCE CAMPUS</span>
                  </div>
                </div>
              )}

              {/* Story Text */}
              <div className={`${newsreader.className} text-base sm:text-lg leading-relaxed text-[#292524] whitespace-pre-line border-y-2 border-[#292524] py-6`}>
                {memory.description}
              </div>

              {/* Winners Section */}
              {winners.length > 0 && (
                <div className="border-2 border-[#292524] p-6 bg-[#f4ebd9]/80">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#292524]">
                    <Trophy className="w-5 h-5 text-[#78350f]" />
                    <h2 className={`${cinzel.className} text-lg font-bold uppercase tracking-wider text-[#1c1917]`}>
                      Honored Laureates &amp; Winners
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {winners.map((w, idx) => (
                      <div
                        key={w.id || idx}
                        className="border border-[#292524] p-3 bg-white flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-full border border-[#292524] overflow-hidden bg-stone-200 relative flex-shrink-0">
                          {w.image_url ? (
                            <Image
                              src={w.image_url}
                              alt={w.name}
                              fill
                              unoptimized={w.image_url.startsWith("http") ? true : false}
                              className="object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-[#78350f] m-auto" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#78350f] text-white">
                            {w.position || "Winner"}
                          </span>
                          <h3 className="text-xs font-bold text-[#1c1917] mt-1">{w.name}</h3>
                          {w.description && (
                            <p className="text-[11px] text-[#57534e] line-clamp-1">{w.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Plates */}
              {photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#292524]">
                    <Camera className="w-5 h-5 text-[#78350f]" />
                    <h2 className={`${cinzel.className} text-lg font-bold uppercase tracking-wider text-[#1c1917]`}>
                      Archive Photographic Plates ({photos.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map((photo, pIdx) => (
                      <div
                        key={photo.id || pIdx}
                        onClick={() => setLightboxIndex(pIdx)}
                        className="border-2 border-[#292524] p-1 bg-white cursor-pointer group hover:scale-[1.02] transition-transform"
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-stone-200">
                          <Image
                            src={photo.image_url}
                            alt={photo.caption || `Archive Photo ${pIdx + 1}`}
                            fill
                            unoptimized={photo.image_url.startsWith("http") ? true : false}
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                        </div>
                        {photo.caption && (
                          <p className="text-[11px] text-[#44403c] italic truncate mt-1 px-1">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-between p-4">
            <div className="w-full flex items-center justify-between text-white text-xs px-2 pt-2">
              <span className="font-mono">
                Plate {lightboxIndex + 1} of {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 text-white hover:text-red-400 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative w-full max-w-5xl h-[70vh] sm:h-[78vh] flex items-center justify-center">
              <Image
                src={photos[lightboxIndex].image_url}
                alt={photos[lightboxIndex].caption || "Enlarged Plate"}
                fill
                unoptimized={photos[lightboxIndex].image_url.startsWith("http") ? true : false}
                className="object-contain"
              />
            </div>

            <div className="w-full max-w-xl flex items-center justify-between pb-3 text-white">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev > 0 ? prev - 1 : photos.length - 1) : null
                  )
                }
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <p className="text-xs text-stone-300 italic text-center px-4 truncate">
                {photos[lightboxIndex].caption || "Archived Moment"}
              </p>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev < photos.length - 1 ? prev + 1 : 0) : null
                  )
                }
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
