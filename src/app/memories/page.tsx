"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/config/supabase";
import { useLenis } from "@/utils/lenis";
import Footer from "../components/reuseable/reusable-home/Footer";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Trophy,
  Camera,
  Layers,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface MemoryItem {
  id: number;
  title: string;
  description: string;
  event_date: string | null;
  type: "event" | "competition";
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  photos_count: number;
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

export default function MemoriesPage() {
  useLenis();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "event" | "competition">("all");

  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("memories")
        .select("*, memory_photos(id)")
        .order("id", { ascending: false });

      if (err) throw err;

      const formatted: MemoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        event_date: row.event_date,
        type: row.type || "event",
        cover_image_url: row.cover_image_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        photos_count: Array.isArray(row.memory_photos) ? row.memory_photos.length : 0,
      }));

      setMemories(formatted);
    } catch (err: any) {
      console.error("Failed to load memories:", err);
      setError("Unable to load memories right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Filtered lists
  const filteredMemories = useMemo(() => {
    if (activeFilter === "all") return memories;
    return memories.filter((m) => m.type === activeFilter);
  }, [memories, activeFilter]);

  const normalEvents = useMemo(
    () => memories.filter((m) => m.type === "event"),
    [memories]
  );
  const competitions = useMemo(
    () => memories.filter((m) => m.type === "competition"),
    [memories]
  );

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
    >
      <div className="w-full flex flex-col items-center pt-24 pb-16 px-4">
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-7xl mx-auto mb-8 text-center px-2 sm:px-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-lg text-sky-700 text-xs font-semibold mb-3">
            <Camera className="w-3.5 h-3.5 text-sky-500" />
            <span>Visual Archive &amp; Milestones</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-700 font-bold tracking-tight">
            Memories
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xl mx-auto leading-relaxed">
            A visual retrospective of poetry meets, open mics, competitions, and triumphant moments at Emerge Literature Club.
          </p>

          {/* Filter Pills */}
          <div className="mt-8 flex items-center justify-center gap-2 bg-gray-200/70 p-1 rounded-2xl w-fit mx-auto">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-white text-zinc-800 shadow-xs"
                  : "text-gray-500 hover:text-zinc-800"
              }`}
            >
              All Memories ({memories.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("event")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeFilter === "event"
                  ? "bg-white text-zinc-800 shadow-xs"
                  : "text-gray-500 hover:text-zinc-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Club Events ({normalEvents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("competition")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeFilter === "competition"
                  ? "bg-white text-zinc-800 shadow-xs"
                  : "text-gray-500 hover:text-zinc-800"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Competitions ({competitions.length})</span>
            </button>
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">
                Loading memories archive...
              </p>
            </div>
          ) : error ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 mb-1">
                Unable to load memories
              </h3>
              <p className="text-xs text-red-600 font-medium mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchMemories}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="py-20 px-6 text-center max-w-md mx-auto bg-white border-2 border-gray-200 rounded-2xl flex flex-col items-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-700">
                No Memories Found
              </h3>
              <p className="text-xs text-gray-400 mt-1 mb-5 leading-relaxed">
                {activeFilter === "all"
                  ? "Our photo archive is currently being updated with memories from past events and competitions."
                  : `No ${activeFilter === "competition" ? "competitions" : "club events"} are cataloged under this filter yet.`}
              </p>
              <Link
                href="/event"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>View Upcoming Events</span>
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeFilter === "all" && normalEvents.length > 0 && competitions.length > 0 ? (
                /* Editorial Split Layout for ALL View */
                <motion.div
                  key="all-split"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-16 px-2 sm:px-6"
                >
                  {/* Competitions Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-amber-200/80">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-zinc-800">
                        Competitions &amp; Contests
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800">
                        {competitions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {competitions.map((item, idx) => (
                        <MemoryCard key={item.id} item={item} index={idx} />
                      ))}
                    </div>
                  </div>

                  {/* Club Events Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-sky-100">
                      <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-zinc-800">
                        Gatherings &amp; Club Events
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        {normalEvents.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {normalEvents.map((item, idx) => (
                        <MemoryCard key={item.id} item={item} index={idx} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Uniform Grid for Single Filter View */
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-6"
                >
                  {filteredMemories.map((item, idx) => (
                    <MemoryCard key={item.id} item={item} index={idx} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function MemoryCard({ item, index }: { item: MemoryItem; index: number }) {
  const isCompetition = item.type === "competition";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
      className="h-full"
    >
      <Link
        href={`/memories/${item.id}`}
        className={`group h-full border-2 p-4 rounded-2xl flex flex-col justify-between bg-white transition-all duration-300 hover:shadow-lg active:scale-98 cursor-pointer ${
          isCompetition
            ? "border-amber-200/80 hover:border-amber-300"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div>
          {/* Cover Photo */}
          <div className="h-60 sm:h-64 w-full overflow-hidden rounded-xl bg-gray-100 relative flex-shrink-0">
            <Image
              src={item.cover_image_url || "/image/logo.png"}
              alt={item.title}
              fill
              unoptimized={item.cover_image_url?.startsWith("http") ? true : false}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              {isCompetition ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
                  <Trophy className="w-3 h-3" />
                  <span>Competition</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>Club Event</span>
                </span>
              )}

              {item.photos_count > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-xs text-white text-[10px] font-medium">
                  <Camera className="w-3 h-3" />
                  <span>{item.photos_count}</span>
                </span>
              )}
            </div>
          </div>

          {/* Date Row */}
          <div className="mt-3.5 flex items-center gap-1.5">
            {item.event_date ? (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                  isCompetition
                    ? "bg-amber-50 text-amber-800"
                    : "bg-sky-50 text-sky-700"
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDisplayDate(item.event_date)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Date to be announced</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-2 text-lg font-bold text-zinc-800 group-hover:text-sky-600 transition-colors line-clamp-1">
            {item.title}
          </h3>

          {/* Description */}
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 line-clamp-3">
            {item.description}
          </p>
        </div>

        {/* Footer CTA */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-sky-600 group-hover:text-sky-700">
          <span>{isCompetition ? "View Winners & Gallery" : "View Photo Gallery"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}
