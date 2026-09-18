"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bebas_Neue, Playfair_Display, DM_Serif_Display, Cinzel, Newsreader, Inter } from "next/font/google";
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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Check,
  Medal,
  User,
  Search,
  Maximize2,
  ExternalLink,
  Flame,
  Bookmark,
  Newspaper,
  Feather,
  Asterisk,
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

interface MemoryPhoto {
  id: number;
  memory_id: number;
  image_url: string;
  caption: string | null;
  display_order?: number;
}

interface MemoryWinner {
  id: number;
  memory_id: number;
  name: string;
  position: string | null;
  image_url: string | null;
  description: string | null;
}

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
  memory_photos?: MemoryPhoto[];
  memory_winners?: MemoryWinner[];
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

function formatNewspaperDate(dateStr: string | null): string {
  if (!dateStr) return "EST. ARCHIVE EDITION";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

export default function MemoriesPage() {
  useLenis();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "event" | "competition">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Reader State for reading any Memory Dispatch
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerPhotos, setReaderPhotos] = useState<MemoryPhoto[]>([]);
  const [readerWinners, setReaderWinners] = useState<MemoryWinner[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch all memories
  const fetchMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("memories")
        .select("*, memory_photos(id, image_url, caption, display_order), memory_winners(id, name, position, image_url, description)")
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
        memory_photos: row.memory_photos || [],
        memory_winners: row.memory_winners || [],
      }));

      setMemories(formatted);
    } catch (err: any) {
      console.error("Failed to load memories:", err);
      setError("Unable to retrieve archive chronicles. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Open Dispatch Reader
  const handleOpenReader = (item: MemoryItem) => {
    setSelectedMemory(item);
    setReaderPhotos(item.memory_photos || []);
    setReaderWinners(item.memory_winners || []);
  };

  // Close Dispatch Reader
  const handleCloseReader = () => {
    setSelectedMemory(null);
    setLightboxIndex(null);
  };

  // Share link
  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered lists
  const filteredMemories = useMemo(() => {
    let list = memories;
    if (activeFilter !== "all") {
      list = list.filter((m) => m.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.event_date && m.event_date.toLowerCase().includes(q))
      );
    }
    return list;
  }, [memories, activeFilter, searchQuery]);

  // Lead Story (Featured Memory) & Secondary Stories
  const leadMemory = useMemo(() => {
    return filteredMemories.length > 0 ? filteredMemories[0] : null;
  }, [filteredMemories]);

  const secondaryMemories = useMemo(() => {
    return filteredMemories.length > 1 ? filteredMemories.slice(1) : [];
  }, [filteredMemories]);

  // Competition Laureates summary count
  const totalWinnersCount = useMemo(() => {
    return memories.reduce((acc, m) => acc + (m.memory_winners?.length || 0), 0);
  }, [memories]);

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-[#f4ebd9] text-[#1c1917] selection:bg-[#78350f] selection:text-[#faf6ee]`}
    >
      {/* Newspaper Broadside Container */}
      <div className="w-full max-w-7xl mx-auto pt-20 pb-20 px-3 sm:px-6 lg:px-8">

        {/* Newspaper Paper Sheet Canvas */}
        <div className="bg-[#faf6ee] border-2 sm:border-[3px] border-[#292524] shadow-[0_20px_50px_rgba(41,37,36,0.15)] rounded-sm p-4 sm:p-8 lg:p-12 relative overflow-hidden">

          {/* Subtle Vintage Texture Accents */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* ========================================================= */}
          {/* 1. TOP HEADER & MASTHEAD SECTION (MATCHING THE SOCIETY)   */}
          {/* ========================================================= */}

          <header className="mb-6">
            {/* Top Double Horizontal Lines */}
            <div className="border-t-[3px] border-b border-[#1c1917] pt-1 pb-1 mb-3">
              <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#44403c] px-1">
                <span>EST. YCCE NAGPUR</span>
                <span>OFFICIAL LITERARY RETROSPECTIVE</span>
                <span>ARCHIVE DISPATCH</span>
              </div>
            </div>

            {/* Giant Condensed Masthead Title (THE SOCIETY style) */}
            <div className="text-center my-2 sm:my-4">
              <h1
                className={`${bebas.className} text-6xl sm:text-8xl md:text-9xl tracking-[0.02em] text-[#1c1917] leading-none uppercase select-none`}
              >
                Inkspire
              </h1>
              <p className={`${cinzel.className} text-[10px] sm:text-xs tracking-[0.3em] font-bold text-[#78350f] uppercase mt-1`}>
                EMERGE LITERATURE CLUB • HISTORIC ARCHIVES
              </p>
            </div>

            {/* Middle Double Rule with Star Dividers */}
            <div className="border-t-2 border-b border-[#1c1917] py-1.5 my-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1c1917] px-2">
                <span>VOL. 19, NO.190</span>
                <span className="text-[#78350f] font-black">✱</span>
                <span>EMERGE-LITERATURE-CLUB.COM</span>
                <span className="text-[#78350f] font-black">✱</span>
                <span>12 MARCH 2026</span>
              </div>
            </div>

            {/* Second Grand Headline: BREAKING NEWS / MEMORIES ARCHIVE */}
            <div className="border-b-[3px] border-t border-[#1c1917] py-2 sm:py-3 text-center my-2">
              <h2
                className={`${dmSerif.className} text-3xl sm:text-5xl lg:text-6xl font-normal text-[#1c1917] tracking-tight uppercase`}
              >
                BREAKING MEMORIES
              </h2>
              <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic mt-0.5 max-w-2xl mx-auto`}>
                Documenting poetry slams, open mic triumphs, mushairas, and milestones at YCCE.
              </p>
            </div>

            {/* Vintage Filter Controls & Search */}
            <div className="mt-4 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">

              {/* Vintage Section Stamps / Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-all border cursor-pointer ${activeFilter === "all"
                      ? "bg-[#1c1917] text-[#faf6ee] border-[#1c1917] shadow-xs"
                      : "bg-[#f4ebd9] text-[#44403c] border-[#292524] hover:bg-[#eae0cb]"
                    }`}
                >
                  All Chronicles ({memories.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("event")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-all border cursor-pointer ${activeFilter === "event"
                      ? "bg-[#1c1917] text-[#faf6ee] border-[#1c1917] shadow-xs"
                      : "bg-[#f4ebd9] text-[#44403c] border-[#292524] hover:bg-[#eae0cb]"
                    }`}
                >
                  <Sparkles className="w-3 h-3 text-[#78350f]" />
                  <span>Club Gatherings ({memories.filter((m) => m.type === "event").length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("competition")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-bold tracking-wider transition-all border cursor-pointer ${activeFilter === "competition"
                      ? "bg-[#1c1917] text-[#faf6ee] border-[#1c1917] shadow-xs"
                      : "bg-[#f4ebd9] text-[#44403c] border-[#292524] hover:bg-[#eae0cb]"
                    }`}
                >
                  <Trophy className="w-3 h-3 text-[#78350f]" />
                  <span>Competitions &amp; Laureates ({memories.filter((m) => m.type === "competition").length})</span>
                </button>
              </div>

              {/* Search Vintage Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-[#fbf8f1] border border-[#292524] text-[#1c1917] placeholder-[#78716c] focus:outline-none focus:ring-1 focus:ring-[#78350f]"
                />
                <Search className="w-3.5 h-3.5 text-[#78716c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#78716c] hover:text-[#1c1917]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* ========================================================= */}
          {/* 3. NEWSPAPER STORIES CONTENT GRID                         */}
          {/* ========================================================= */}

          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#78350f] animate-spin" />
              <p className={`${newsreader.className} text-base text-[#57534e] italic`}>
                Printing today&apos;s literary chronicle...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center max-w-md mx-auto border-2 border-red-800 bg-[#fef2f2] p-6 my-8">
              <AlertCircle className="w-8 h-8 text-red-700 mx-auto mb-2" />
              <h3 className={`${playfair.className} text-lg font-bold text-red-900`}>
                Press Dispatch Interrupted
              </h3>
              <p className="text-xs text-red-700 mt-1 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchMemories}
                className="px-4 py-1.5 bg-[#292524] text-[#faf6ee] text-xs font-bold uppercase tracking-wider hover:bg-black"
              >
                Reprint Gazette
              </button>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="py-16 px-6 text-center max-w-lg mx-auto border-2 border-dashed border-[#a8a29e] my-8">
              <ImageIcon className="w-10 h-10 text-[#78716c] mx-auto mb-3" />
              <h3 className={`${playfair.className} text-xl font-bold text-[#292524]`}>
                No Archive Dispatches Found
              </h3>
              <p className={`${newsreader.className} text-sm text-[#57534e] italic mt-1.5 mb-5`}>
                {searchQuery
                  ? `No memory articles matching "${searchQuery}" exist in our records.`
                  : "Our archival curators are presently indexing past open mics and competitions."}
              </p>
              <Link
                href="/event"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#292524] text-[#faf6ee] text-xs font-bold uppercase tracking-wider hover:bg-black"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Browse Upcoming Events</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-10">

              {/* -------------------------------------------------- */}
              {/* A. LEAD ARTICLE (Featured Frontpage Story)          */}
              {/* -------------------------------------------------- */}
              {leadMemory && (
                <article className="border-b-[3px] border-[#292524] pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                    {/* Left Column: Lead Photo & Picture Caption */}
                    <div className="lg:col-span-7 flex flex-col">
                      <div
                        onClick={() => handleOpenReader(leadMemory)}
                        className="group relative w-full aspect-[16/10] sm:aspect-[16/9] border-2 border-[#292524] p-1 bg-white overflow-hidden shadow-xs cursor-pointer"
                      >
                        <div className="relative w-full h-full overflow-hidden bg-stone-300">
                          <Image
                            src={leadMemory.cover_image_url || "/image/logo.png"}
                            alt={leadMemory.title}
                            fill
                            priority
                            unoptimized={leadMemory.cover_image_url?.startsWith("http") ? true : false}
                            className="object-cover filter grayscale contrast-115 sepia-[0.25] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
                            <span className="px-2 py-0.5 bg-[#1c1917] text-[#faf6ee] text-[10px] font-bold uppercase tracking-wider">
                              Front Page Lead
                            </span>
                            {leadMemory.type === "competition" && (
                              <span className="px-2 py-0.5 bg-[#78350f] text-[#faf6ee] text-[10px] font-bold uppercase tracking-wider">
                                Competition
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            <span>{leadMemory.photos_count} Photos</span>
                          </div>
                        </div>
                      </div>

                      {/* Picture Caption Box matching the reference photo */}
                      <div className="mt-2 text-left border-t border-b border-[#292524] py-1 px-1.5 flex items-center justify-between text-[11px] font-semibold text-[#44403c] uppercase tracking-wider">
                        <span>PICTURE CAPTION: {leadMemory.title}</span>
                        <span className="text-[#78350f]">{formatNewspaperDate(leadMemory.event_date)}</span>
                      </div>
                    </div>

                    {/* Right Column: Lead Headline & Multi-Column Story */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full">
                      <div>
                        {/* Kicker byline */}
                        <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#78350f]">
                          <span>SPECIAL DISPATCH</span>
                          <span>•</span>
                          <span>BY EMERGE EDITORIAL BOARD</span>
                        </div>

                        {/* Big Lead Headline */}
                        <h3
                          onClick={() => handleOpenReader(leadMemory)}
                          className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl font-black text-[#1c1917] hover:text-[#78350f] transition-colors cursor-pointer leading-tight`}
                        >
                          {leadMemory.title}
                        </h3>

                        {/* Byline / Location Strip */}
                        <div className="my-2.5 py-1 border-y border-[#d6cebf] text-[11px] uppercase tracking-wider text-[#57534e] font-semibold flex items-center justify-between">
                          <span>LOCATION: YCCE CAMPUS</span>
                          <span>DATE: {formatDisplayDate(leadMemory.event_date)}</span>
                        </div>

                        {/* Article Paragraph with Vintage Drop Cap */}
                        <div className={`${newsreader.className} text-sm sm:text-base leading-relaxed text-[#292524] text-justify space-y-3`}>
                          <p className="first-letter:float-left first-letter:text-5xl first-letter:font-black first-letter:font-serif first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#1c1917]">
                            {leadMemory.description}
                          </p>
                        </div>
                      </div>

                      {/* Read Full Article Button */}
                      <div className="mt-5 pt-3 border-t border-[#292524] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleOpenReader(leadMemory)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1c1917] hover:bg-[#78350f] text-[#faf6ee] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Open Full Chronicle Edition</span>
                        </button>

                        <span className="text-[11px] font-bold text-[#78350f] uppercase tracking-wider">
                          Turn to Page 2 &rarr;
                        </span>
                      </div>
                    </div>

                  </div>
                </article>
              )}

              {/* -------------------------------------------------- */}
              {/* B. SECONDARY BROADSHEET ARTICLES & GRID            */}
              {/* -------------------------------------------------- */}
              {secondaryMemories.length > 0 && (
                <div>
                  {/* Section Divider Bar */}
                  <div className="border-b-2 border-[#292524] pb-1.5 mb-6 flex items-center justify-between">
                    <h3 className={`${cinzel.className} text-lg sm:text-xl font-bold uppercase tracking-wider text-[#1c1917]`}>
                      Archived Stories &amp; Past Editions
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#78350f]">
                      {secondaryMemories.length} ARTICLES IN PRINT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {secondaryMemories.map((item, idx) => {
                      const isCompetition = item.type === "competition";
                      return (
                        <article
                          key={item.id}
                          className="border border-[#292524] p-4 bg-[#fbf8f1] flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
                        >
                          <div>
                            {/* Photo Clipping */}
                            <div
                              onClick={() => handleOpenReader(item)}
                              className="relative h-48 w-full border border-[#292524] p-1 bg-white mb-3 cursor-pointer overflow-hidden"
                            >
                              <div className="relative w-full h-full overflow-hidden bg-stone-200">
                                <Image
                                  src={item.cover_image_url || "/image/logo.png"}
                                  alt={item.title}
                                  fill
                                  unoptimized={item.cover_image_url?.startsWith("http") ? true : false}
                                  className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                                />
                                {item.photos_count > 0 && (
                                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/75 text-white text-[9px] font-bold">
                                    {item.photos_count} PHOTOS
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Kicker Headline */}
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#78350f] mb-1">
                              <span>{isCompetition ? "HONORS DISPATCH" : "COMMUNITY DISPATCH"}</span>
                              <span>{formatDisplayDate(item.event_date)}</span>
                            </div>

                            {/* Article Headline */}
                            <h4
                              onClick={() => handleOpenReader(item)}
                              className={`${playfair.className} text-lg font-bold text-[#1c1917] group-hover:text-[#78350f] transition-colors line-clamp-2 leading-snug cursor-pointer`}
                            >
                              {item.title}
                            </h4>

                            {/* Byline */}
                            <p className="text-[10px] uppercase font-semibold text-[#57534e] mt-1 mb-2 border-b border-[#e7e0d2] pb-1">
                              BY EMERGE CORRESPONDENT
                            </p>

                            {/* Story Excerpt */}
                            <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] line-clamp-4 text-justify`}>
                              {item.description}
                            </p>
                          </div>

                          {/* Article Footer Link */}
                          <div className="mt-4 pt-2.5 border-t border-[#292524] flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleOpenReader(item)}
                              className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] hover:text-[#78350f] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Read Dispatch</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {isCompetition && (
                              <span className="text-[10px] font-bold text-[#78350f] uppercase">
                                ★ Competition
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* 4. VINTAGE ADVERTISEMENT / NOTICE SECTION                 */}
          {/* Matching bottom of provided newspaper image               */}
          {/* ========================================================= */}
          <div className="mt-12 pt-6 border-t-[3px] border-[#292524]">
            <div className="border-2 border-dashed border-[#292524] p-4 sm:p-6 bg-[#f4ebd9]/70 relative text-center">

              {/* Corner Ornaments */}
              <div className="absolute top-1 left-1 text-[10px] font-serif text-[#78350f]">◆</div>
              <div className="absolute top-1 right-1 text-[10px] font-serif text-[#78350f]">◆</div>
              <div className="absolute bottom-1 left-1 text-[10px] font-serif text-[#78350f]">◆</div>
              <div className="absolute bottom-1 right-1 text-[10px] font-serif text-[#78350f]">◆</div>

              <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Left Emblem / Graphic */}
                <div className="flex items-center gap-3 text-left">
                  <div className="w-14 h-14 rounded-full border-2 border-[#292524] flex items-center justify-center bg-white p-2 flex-shrink-0 shadow-xs">
                    <Feather className="w-7 h-7 text-[#78350f]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#78350f]">
                      LITERARY CLASSIFIED NOTICE
                    </span>
                    <h4 className={`${playfair.className} text-xl sm:text-2xl font-black text-[#1c1917] uppercase tracking-wide`}>
                      Advertisement to share your poetry!
                    </h4>
                    <p className={`${newsreader.className} text-xs text-[#44403c] italic mt-0.5`}>
                      Do your verses deserve the grand stage? Submit your thoughts or register for upcoming slams.
                    </p>
                  </div>
                </div>

                {/* Right Call To Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 flex-shrink-0">
                  <Link
                    href="/shers"
                    className="px-4 py-2 bg-[#292524] hover:bg-black text-[#faf6ee] text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                  >
                    Read Shayari Feed
                  </Link>

                  <Link
                    href="/event"
                    className="px-4 py-2 bg-[#78350f] hover:bg-[#92400e] text-[#faf6ee] text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                  >
                    Upcoming Events
                  </Link>
                </div>

              </div>

              {/* Bottom Classified Tagline matching reference */}
              <div className="mt-4 pt-2 border-t border-[#d6cebf] flex flex-wrap items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#57534e]">
                <span>EMERGE-LITERATURE-CLUB.YCCE</span>
                <span>❦ WHERE EVERY UNTOLD STORY EMERGES ❦</span>
                <span>FREE &amp; OPEN ACCESS</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. VINTAGE FULL DISPATCH READER MODAL                     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-[#faf6ee] border-2 sm:border-4 border-[#292524] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto"
            >
              {/* Modal Top Masthead Bar */}
              <div className="px-4 sm:px-6 py-3 border-b-2 border-[#292524] bg-[#f4ebd9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Feather className="w-4 h-4 text-[#78350f]" />
                  <span className={`${cinzel.className} text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1c1917]`}>
                    The Emerge Gazette • Special Dispatch
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-1.5 text-[#44403c] hover:text-[#1c1917] border border-[#292524] bg-white rounded-none cursor-pointer"
                    title="Copy Archive Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseReader}
                    className="p-1.5 text-[#1c1917] hover:bg-[#1c1917] hover:text-white border border-[#292524] bg-white transition-colors cursor-pointer"
                    title="Close Chronicle"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Article Body */}
              <div className="p-4 sm:p-8 overflow-y-auto space-y-6">

                {/* Headline & Metadata */}
                <div className="border-b-2 border-[#292524] pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#78350f] mb-1">
                    <span>{selectedMemory.type === "competition" ? "COMPETITION REPORT" : "CLUB EVENT ARCHIVE"}</span>
                    <span>•</span>
                    <span>RECORDED ON: {formatDisplayDate(selectedMemory.event_date)}</span>
                  </div>

                  <h2 className={`${playfair.className} text-2xl sm:text-4xl font-extrabold text-[#1c1917] leading-tight`}>
                    {selectedMemory.title}
                  </h2>
                </div>

                {/* Cover Photograph Frame */}
                {selectedMemory.cover_image_url && (
                  <div className="border-2 border-[#292524] p-1 bg-white">
                    <div className="relative w-full h-64 sm:h-96 overflow-hidden bg-stone-200">
                      <Image
                        src={selectedMemory.cover_image_url}
                        alt={selectedMemory.title}
                        fill
                        unoptimized={selectedMemory.cover_image_url.startsWith("http") ? true : false}
                        className="object-cover"
                      />
                    </div>
                    <div className="py-1 px-2 border-t border-[#292524] text-[11px] font-bold uppercase tracking-wider text-[#44403c] flex items-center justify-between">
                      <span>Cover Illustration: {selectedMemory.title}</span>
                      <span>YCCE Archives</span>
                    </div>
                  </div>
                )}

                {/* Story Full Text */}
                <div className={`${newsreader.className} text-sm sm:text-base leading-relaxed text-[#292524] whitespace-pre-line border-y border-[#d6cebf] py-4`}>
                  {selectedMemory.description}
                </div>

                {/* Competition Winners / Honors Roll */}
                {readerWinners.length > 0 && (
                  <div className="border-2 border-[#292524] p-4 sm:p-6 bg-[#f4ebd9]/80">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#292524]">
                      <Trophy className="w-5 h-5 text-[#78350f]" />
                      <h3 className={`${cinzel.className} text-base sm:text-lg font-bold uppercase tracking-wider text-[#1c1917]`}>
                        Honors &amp; Laureates Roll
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {readerWinners.map((w, idx) => (
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
                            <h4 className="text-xs font-bold text-[#1c1917] mt-1">{w.name}</h4>
                            {w.description && (
                              <p className="text-[11px] text-[#57534e] line-clamp-1">{w.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery Photographs Section */}
                {readerPhotos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#292524]">
                      <Camera className="w-5 h-5 text-[#78350f]" />
                      <h3 className={`${cinzel.className} text-base sm:text-lg font-bold uppercase tracking-wider text-[#1c1917]`}>
                        Photo Archives ({readerPhotos.length} Plates)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {readerPhotos.map((photo, pIdx) => (
                        <div
                          key={photo.id || pIdx}
                          onClick={() => setLightboxIndex(pIdx)}
                          className="border border-[#292524] p-1 bg-white cursor-pointer group hover:scale-[1.02] transition-transform"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-stone-200">
                            <Image
                              src={photo.image_url}
                              alt={photo.caption || `Archive Photo ${pIdx + 1}`}
                              fill
                              unoptimized={photo.image_url.startsWith("http") ? true : false}
                              className="object-cover group-hover:contrast-110 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                          {photo.caption && (
                            <p className="text-[10px] text-[#44403c] italic truncate mt-1 px-1">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-4 sm:px-6 py-3 border-t-2 border-[#292524] bg-[#f4ebd9] flex items-center justify-between text-xs font-bold uppercase">
                <span className="text-[#57534e]">Emerge Literature Archive System</span>
                <button
                  type="button"
                  onClick={handleCloseReader}
                  className="px-4 py-1.5 bg-[#1c1917] text-white hover:bg-[#78350f] transition-colors cursor-pointer"
                >
                  Close Dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 6. LIGHTBOX FOR HIGH-RESOLUTION GALLERY VIEW              */}
      {/* ========================================================= */}
      <AnimatePresence>
        {lightboxIndex !== null && readerPhotos[lightboxIndex] && (
          <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-between p-4">
            <div className="w-full flex items-center justify-between text-white text-xs px-2 pt-2">
              <span className="font-mono">
                Plate {lightboxIndex + 1} of {readerPhotos.length}
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
                src={readerPhotos[lightboxIndex].image_url}
                alt={readerPhotos[lightboxIndex].caption || "Enlarged Plate"}
                fill
                unoptimized={readerPhotos[lightboxIndex].image_url.startsWith("http") ? true : false}
                className="object-contain"
              />
            </div>

            {/* Lightbox Navigation */}
            <div className="w-full max-w-xl flex items-center justify-between pb-3 text-white">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev > 0 ? prev - 1 : readerPhotos.length - 1) : null
                  )
                }
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-none text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <p className="text-xs text-stone-300 italic text-center px-4 truncate">
                {readerPhotos[lightboxIndex].caption || "Archived Moment"}
              </p>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev < readerPhotos.length - 1 ? prev + 1 : 0) : null
                  )
                }
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-none text-xs flex items-center gap-1 cursor-pointer"
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
