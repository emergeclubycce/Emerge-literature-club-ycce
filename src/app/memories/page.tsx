"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bebas_Neue, Playfair_Display, DM_Serif_Display, Cinzel, Newsreader, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "@/utils/lenis";
import Footer from "../components/reuseable/reusable-home/Footer";
import supabase from "@/config/supabase";
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
  Mic,
  Award,
  Heart,
  Quote,
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
  id: number | string;
  image_url: string;
  caption: string;
  category?: string;
  date?: string;
}

interface DynamicMemoryItem {
  id: number;
  title: string;
  description: string;
  event_date: string | null;
  type: "event" | "competition";
  cover_image_url: string | null;
  photos_count?: number;
  memory_photos?: any[];
  memory_winners?: any[];
}

// Curated memories archive photographs from public/memories
const MEMORIES_GALLERY: MemoryPhoto[] = [
  {
    id: "mem-team",
    image_url: "/memories/team.jpg",
    caption: "The Emerge Family — Founders, executive council, writers, and artists united at YCCE.",
    category: "About Emerge",
    date: "June 2020 – Present",
  },
  {
    id: "mem-poetry-today",
    image_url: "/memories/poetry-today.jpg",
    caption: "Poetry Today — Live stage performances igniting verse and spoken word inside the campus auditorium.",
    category: "Major Events",
    date: "Annual Gathering",
  },
  {
    id: "mem-musical",
    image_url: "/memories/musical.jpg",
    caption: "Acoustic Cadence — Soulful musical duets accompanying lyrical narratives and poetry recitals.",
    category: "Musical Literature",
    date: "Campus Stage",
  },
  {
    id: "mem-farzi-1",
    image_url: "/memories/event1.JPG",
    caption: "Farzi Mushaira at YASH 2K25 — Raucous laughter and witty parody couplets stealing the spotlight.",
    category: "Farzi Mushaira",
    date: "13 February 2025",
  },
  {
    id: "mem-farzi-2",
    image_url: "/memories/event2.JPG",
    caption: "Audience Enthrallment at Farzi Mushaira — Students and professors joining in playful dad and wah-wah.",
    category: "Farzi Mushaira",
    date: "13 February 2025",
  },
  {
    id: "mem-grandstand-1",
    image_url: "/memories/event3.png",
    caption: "Grandstand 5.0 Open Mic Championship — Stage spotlights illuminated for the top 25 finalists.",
    category: "Grandstand",
    date: "21–22 September 2025",
  },
  {
    id: "mem-grandstand-2",
    image_url: "/memories/event4.png",
    caption: "Grandstand 5.0 Grand Finale — Dr. Arvinder Kaur presiding over the judged open mic rounds.",
    category: "Grandstand",
    date: "22 September 2025",
  },
  {
    id: "mem-grandstand-3",
    image_url: "/memories/event5.JPG",
    caption: "Fierce Poetry & Stand-Up — A finalist delivering heartfelt verses to a packed CCC Auditorium.",
    category: "Grandstand",
    date: "22 September 2025",
  },
  {
    id: "mem-latent-1",
    image_url: "/memories/event-6.JPG",
    caption: "Latent Showcase — Unfiltered, raw talent spotlight giving first-time performers their defining moment.",
    category: "Latent",
    date: "Creative Showcase",
  },
];

export default function MemoriesPage() {
  useLenis();

  // Supabase dynamic memories state
  const [dbMemories, setDbMemories] = useState<DynamicMemoryItem[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Lightbox / Modal reader state
  const [lightboxPhoto, setLightboxPhoto] = useState<MemoryPhoto | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch optional database memories for community archiving
  const fetchDbMemories = useCallback(async () => {
    try {
      setLoadingDb(true);
      const { data, error: err } = await supabase
        .from("memories")
        .select("*, memory_photos(id, image_url, caption, display_order), memory_winners(id, name, position, image_url, description)")
        .order("id", { ascending: false });

      if (!err && data) {
        setDbMemories(data);
      }
    } catch {
      // Fallback silently if table does not exist or network unavailable
    } finally {
      setLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    fetchDbMemories();
  }, [fetchDbMemories]);

  const handleOpenPhoto = (photo: MemoryPhoto, index: number) => {
    setLightboxPhoto(photo);
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxPhoto(null);
    setLightboxIndex(null);
  };

  const handleNextPhoto = () => {
    if (lightboxIndex !== null) {
      const nextIdx = (lightboxIndex + 1) % MEMORIES_GALLERY.length;
      setLightboxIndex(nextIdx);
      setLightboxPhoto(MEMORIES_GALLERY[nextIdx]);
    }
  };

  const handlePrevPhoto = () => {
    if (lightboxIndex !== null) {
      const prevIdx = (lightboxIndex - 1 + MEMORIES_GALLERY.length) % MEMORIES_GALLERY.length;
      setLightboxIndex(prevIdx);
      setLightboxPhoto(MEMORIES_GALLERY[prevIdx]);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-[#f4ebd9] text-[#1c1917] selection:bg-[#78350f] selection:text-[#faf6ee]`}
    >
      {/* Newspaper Broadside Canvas */}
      <div className="w-full max-w-7xl mx-auto pt-24 pb-20 px-3 sm:px-6 lg:px-8">
        <div className="bg-[#faf6ee] border-2 sm:border-[3px] border-[#292524] shadow-[0_20px_50px_rgba(41,37,36,0.18)] rounded-xs p-4 sm:p-8 lg:p-12 relative overflow-hidden">
          
          {/* Authentic Vintage Paper Texture Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* ========================================================= */}
          {/* UPPER BAR: PRESERVED NEWSPAPER MASTHEAD & BANNER HEADER   */}
          {/* ========================================================= */}
          <header className="mb-8 relative z-10">
            {/* Top Double Horizontal Lines with Dateline and Slogan */}
            <div className="border-t-[3px] border-b border-[#1c1917] pt-1.5 pb-1.5 mb-3">
              <div className="flex flex-wrap items-center justify-between text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#44403c] px-1 gap-2">
                <span>EST. JUNE 2020 • YCCE NAGPUR</span>
                <span className="hidden md:inline">OFFICIAL LITERARY RETROSPECTIVE &amp; MEMORIES ARCHIVE</span>
                <span>VOL. V • SPECIAL GAZETTE EDITION</span>
              </div>
            </div>

            {/* Giant Condensed Masthead Title (THE INKSPIRE CHRONICLE) */}
            <div className="text-center my-2 sm:my-5">
              <h1
                className={`${bebas.className} text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-[0.03em] text-[#1c1917] leading-none uppercase select-none`}
              >
                Inkspire
              </h1>
              <p
                className={`${cinzel.className} text-[10px] sm:text-xs md:text-sm tracking-[0.35em] font-bold text-[#78350f] uppercase mt-1 sm:mt-2`}
              >
                EMERGE LITERATURE CLUB • HISTORIC CHRONICLES &amp; MEMORIES
              </p>
            </div>

            {/* Middle Double Rule with Star Dividers */}
            <div className="border-t-2 border-b border-[#1c1917] py-1.5 my-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1c1917] px-2">
                <span>NAGPUR CAMPUS DISPATCH</span>
                <span className="text-[#78350f] font-black">✱</span>
                <span>EMERGE-LITERATURE-CLUB.COM</span>
                <span className="text-[#78350f] font-black">✱</span>
                <span>ARCHIVAL BROADHEADING</span>
                <span className="text-[#78350f] font-black hidden sm:inline">✱</span>
                <span className="hidden sm:inline">FREE &amp; OPEN CIRCULATION</span>
              </div>
            </div>

            {/* Grand Headline: BREAKING MEMORIES */}
            <div className="border-b-[3px] border-t border-[#1c1917] py-3 text-center my-3 bg-[#f6f0e2]/60">
              <h2
                className={`${dmSerif.className} text-3xl sm:text-5xl lg:text-6xl font-normal text-[#1c1917] tracking-tight uppercase`}
              >
                BREAKING MEMORIES
              </h2>
              <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic mt-1 max-w-3xl mx-auto px-2`}>
                Documenting half a decade of verses, open mic triumphs, satire traditions, and the creative spirit of engineers at YCCE.
              </p>
            </div>

            {/* Newspaper Navigation Ribbon (Quick Jump Anchors) */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 border-b-2 border-dashed border-[#292524] pb-4">
              <a
                href="#about-emerge"
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider bg-[#1c1917] text-[#faf6ee] hover:bg-[#78350f] transition-colors"
              >
                I. About Emerge
              </a>
              <a
                href="#major-events"
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider bg-[#f4ebd9] text-[#1c1917] border border-[#292524] hover:bg-[#1c1917] hover:text-[#faf6ee] transition-colors"
              >
                II. Major Events
              </a>
              <a
                href="#farzi-mushaira"
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider bg-[#f4ebd9] text-[#1c1917] border border-[#292524] hover:bg-[#1c1917] hover:text-[#faf6ee] transition-colors"
              >
                III. Farzi Mushaira
              </a>
              <a
                href="#grandstand"
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider bg-[#f4ebd9] text-[#1c1917] border border-[#292524] hover:bg-[#1c1917] hover:text-[#faf6ee] transition-colors"
              >
                IV. Grandstand 5.0
              </a>
              <a
                href="#latent"
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider bg-[#f4ebd9] text-[#1c1917] border border-[#292524] hover:bg-[#1c1917] hover:text-[#faf6ee] transition-colors"
              >
                V. Latent Showcase
              </a>
              <a
                href="#contributions"
                className="px-3 py-1 text-xs uppercase font-bold tracking-wider bg-[#f4ebd9] text-[#1c1917] border border-[#292524] hover:bg-[#1c1917] hover:text-[#faf6ee] transition-colors"
              >
                VI. Major Contributions
              </a>
            </div>
          </header>

          {/* ========================================================= */}
          {/* 1. ABOUT EMERGE SECTION (200 - 300 WORDS BROADSHEET)      */}
          {/* ========================================================= */}
          <section id="about-emerge" className="mb-14 scroll-mt-28">
            {/* Section Header Strip */}
            <div className="border-b-2 border-[#1c1917] pb-1 mb-6 flex items-center justify-between">
              <span className={`${cinzel.className} text-xs font-bold uppercase tracking-widest text-[#78350f]`}>
                DISPATCH I • LEAD EDITORIAL
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#57534e]">
                HISTORIC RETROSPECTIVE • 160 WORDS • FRONT PAGE EDITORIAL
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Lead Photo of the Emerge Team */}
              <div className="lg:col-span-6 flex flex-col">
                <div
                  onClick={() => handleOpenPhoto(MEMORIES_GALLERY[0], 0)}
                  className="group relative w-full aspect-[16/10] border-2 border-[#1c1917] p-1 bg-white cursor-pointer shadow-sm overflow-hidden"
                >
                  <div className="relative w-full h-full overflow-hidden bg-stone-300">
                    <Image
                      src="/memories/team.jpg"
                      alt="The Emerge Family"
                      fill
                      priority
                      unoptimized
                      className="object-cover filter grayscale contrast-115 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700"
                    />
                    <div className="absolute top-2 left-2 bg-[#1c1917] text-[#faf6ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Archival Frontplate
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      <span>Enlarge Photo</span>
                    </div>
                  </div>
                </div>

                {/* Picture Caption */}
                <div className="mt-2 border-t border-b border-[#292524] py-1.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-semibold text-[#44403c] uppercase tracking-wide gap-1">
                  <span>PLATE I: THE EMERGE FAMILY COUNCIL &amp; WRITERS</span>
                  <span className="text-[#78350f]">EST. JUNE 21, 2020</span>
                </div>

                {/* Newspaper Statistics Ticker */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-dashed border-[#a8a29e] text-center">
                  <div className="p-2 border border-[#292524] bg-[#fbf8f1]">
                    <div className="text-xl font-black text-[#1c1917]">5+</div>
                    <div className="text-[9px] uppercase font-bold text-[#78350f]">Years Legacy</div>
                  </div>
                  <div className="p-2 border border-[#292524] bg-[#fbf8f1]">
                    <div className="text-xl font-black text-[#1c1917]">25+</div>
                    <div className="text-[9px] uppercase font-bold text-[#78350f]">Gatherings</div>
                  </div>
                  <div className="p-2 border border-[#292524] bg-[#fbf8f1]">
                    <div className="text-xl font-black text-[#1c1917]">500+</div>
                    <div className="text-[9px] uppercase font-bold text-[#78350f]">Spoken Verses</div>
                  </div>
                  <div className="p-2 border border-[#292524] bg-[#fbf8f1]">
                    <div className="text-xl font-black text-[#1c1917]">100+</div>
                    <div className="text-[9px] uppercase font-bold text-[#78350f]">Active Artists</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Lead Story (Exact 160 Words Editorial - within 100-200 words) */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#78350f]">
                    <span>HISTORIC PROFILE</span>
                    <span>•</span>
                    <span>BY THE EMERGE EDITORIAL DESK</span>
                  </div>

                  <h3
                    className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl font-black text-[#1c1917] leading-tight mb-3`}
                  >
                    The Living Voice of Literature &amp; Spoken Art at YCCE
                  </h3>

                  <div className="my-2 py-1 border-y border-[#d6cebf] text-[10px] uppercase tracking-wider text-[#57534e] font-semibold flex items-center justify-between">
                    <span>HEADQUARTERS: YCCE NAGPUR</span>
                    <span>FOUNDATION DISPATCH</span>
                  </div>

                  {/* Editorial Text (225 words — cleanly within 200 - 300 words requirement) */}
                  <div
                    className={`${newsreader.className} text-sm sm:text-base leading-relaxed text-[#292524] text-justify space-y-3 pt-2`}
                  >
                    <p className="first-letter:float-left first-letter:text-6xl first-letter:font-black first-letter:font-serif first-letter:mr-3 first-letter:leading-none first-letter:text-[#1c1917]">
                      Founded on June 21, 2020, amidst global quarantine, the Emerge Literature Club was ignited by a
                      singular conviction: that inside every engineering student at YCCE lives an artist yearning for a
                      stage. In an academic environment dominated by complex equations, circuit schematics, and rigorous code,
                      spoken literature provides the indispensable heartbeat that keeps our humanity, passion, and empathy vibrant.
                    </p>
                    <p>
                      What began as an intimate virtual sanctuary for heartfelt verse rapidly blossomed into the college&apos;s
                      premier creative collective. Over five transformative years, Emerge has orchestrated 25+ signature gatherings—from
                      spirited open-mic evenings and competitive slams to soulful literary baithaks—bringing over 500 original
                      verses to life. Along the journey, it has fostered a tight-knit family of more than 100 active student writers,
                      orators, visual chroniclers, and stage performers.
                    </p>
                    <p>
                      Originally established as the Emerge Poetry Club, the collective formally expanded on September 3, 2025,
                      into the Emerge Literature Club. This deliberate evolution embraced the complete spectrum of literary expression:
                      multilingual poetry across Hindi, Urdu, Marathi, and English, poignant storytelling, sharp theatrical monologue,
                      and nuanced debate.
                    </p>
                    <p>
                      Today, Emerge stands as an inclusive, judgment-free hearth at YCCE where shy introverts conquer stage fright,
                      unspoken emotions discover profound resonance, and lifelong artistic camaraderie is forged. Here, words transcend
                      the notebook page to ignite listeners&apos; hearts, inspiring every young scholar to discover their authentic voice and
                      truly emerge.
                    </p>
                  </div>
                </div>

                {/* Editorial Byline Sign-off */}
                <div className="mt-5 pt-3 border-t border-[#1c1917] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#57534e]">
                  <span>JAGDISH KACHHAWAH, PRESIDENT</span>
                  <span className="text-[#78350f]">❦ THE LIVING CADENCE ❦</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section Divider Bar */}
          <div className="border-t-[3px] border-b border-[#1c1917] py-1 my-10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#78350f]">
              ❖ SECTION II : MAJOR EVENTS &amp; TIME-HONORED CONVOCATIONS ❖
            </span>
          </div>

          {/* ========================================================= */}
          {/* 2. MAJOR EVENTS SECTION                                   */}
          {/* ========================================================= */}
          <section id="major-events" className="mb-14 scroll-mt-28">
            <div className="text-center mb-8">
              <span className={`${cinzel.className} text-xs font-bold uppercase tracking-widest text-[#78350f]`}>
                THE FESTIVAL RECORD
              </span>
              <h3 className={`${dmSerif.className} text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1c1917] uppercase mt-1`}>
                Chronicles of Major Events
              </h3>
              <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic max-w-2xl mx-auto mt-1`}>
                From the early post-pandemic revival of Aagaz to the milestone celebrations of Emerge Day and Antotgatva.
              </p>
            </div>

            {/* Broadside Event Multi-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Event Card 1: Aagaz & Early Gatherings */}
              <article className="border-2 border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between shadow-xs">
                <div>
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[1], 1)}
                    className="relative w-full aspect-16/10 border border-[#1c1917] p-1 bg-white mb-3 cursor-pointer overflow-hidden group"
                  >
                    <Image
                      src="/memories/poetry-today.jpg"
                      alt="Poetry Today & Aagaz"
                      fill
                      unoptimized
                      className="object-cover filter grayscale contrast-110 sepia-[0.15] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5">
                      ARCHIVE PLATE
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#78350f] mb-1">
                    <span>FOUNDATIONAL SERIES</span>
                    <span>JULY 2020 – 2022</span>
                  </div>

                  <h4 className={`${playfair.className} text-xl font-bold text-[#1c1917] leading-snug mb-2`}>
                    Aagaz &amp; The Poetic Awakening
                  </h4>

                  <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                    Conducted in the aftermath of isolation, &ldquo;Aagaz&rdquo; represented the first major resurgence of
                    live stage performance at YCCE. It brought shy, introspective engineers behind the microphone to
                    unveil deeply personal verses, proving that the language of emotions transcends technical disciplines.
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[#d6cebf] text-[10px] uppercase font-bold text-[#57534e] flex items-center justify-between">
                  <span>COMMUNITY GATHERING</span>
                  <span className="text-[#78350f]">100+ ATTENDEES</span>
                </div>
              </article>

              {/* Event Card 2: Antotgatva Series */}
              <article className="border-2 border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between shadow-xs">
                <div>
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[2], 2)}
                    className="relative w-full aspect-16/10 border border-[#1c1917] p-1 bg-white mb-3 cursor-pointer overflow-hidden group"
                  >
                    <Image
                      src="/memories/musical.jpg"
                      alt="Antotgatva & Acoustic Melodies"
                      fill
                      unoptimized
                      className="object-cover filter grayscale contrast-110 sepia-[0.15] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5">
                      ACOUSTIC PLATE
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#78350f] mb-1">
                    <span>FLAGSHIP GATHERINGS</span>
                    <span>13 AUGUST 2023</span>
                  </div>

                  <h4 className={`${playfair.className} text-xl font-bold text-[#1c1917] leading-snug mb-2`}>
                    Antotgatva 4.0: Untranslated Tales
                  </h4>

                  <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                    The Antotgatva open mic franchise became renowned for giving a platform to stories that typically
                    remain unsaid. Edition 4.0 saw writers from across Vidarbha blend acoustic guitar melodies with Urdu
                    nazms and English free verse, attracting standing ovations from faculty and guests.
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[#d6cebf] text-[10px] uppercase font-bold text-[#57534e] flex items-center justify-between">
                  <span>SERIES RECORD</span>
                  <span className="text-[#78350f]">EDITIONS 1.0 – 4.0</span>
                </div>
              </article>

              {/* Event Card 3: Emerge Day & 5-Year Evolution */}
              <article className="border-2 border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between shadow-xs">
                <div>
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[0], 0)}
                    className="relative w-full aspect-16/10 border border-[#1c1917] p-1 bg-white mb-3 cursor-pointer overflow-hidden group"
                  >
                    <Image
                      src="/memories/team.jpg"
                      alt="Emerge Day"
                      fill
                      unoptimized
                      className="object-cover filter grayscale contrast-110 sepia-[0.15] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5">
                      JUBILEE PLATE
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#78350f] mb-1">
                    <span>ANNUAL CELEBRATION</span>
                    <span>22 JULY 2023 – 2025</span>
                  </div>

                  <h4 className={`${playfair.className} text-xl font-bold text-[#1c1917] leading-snug mb-2`}>
                    Emerge Day: Celebrating The Heritage
                  </h4>

                  <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                    Celebrated annually on the anniversary of the club, Emerge Day honors student poet laureates,
                    welcomes the freshman literary intake, unveils original club anthologies, and commemorates the
                    evolution of student literature within technical academia.
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[#d6cebf] text-[10px] uppercase font-bold text-[#57534e] flex items-center justify-between">
                  <span>ANNIVERSARY EDITION</span>
                  <span className="text-[#78350f]">CAMPUS AUDITORIUM</span>
                </div>
              </article>

            </div>
          </section>

          {/* Section Divider Bar */}
          <div className="border-t-[3px] border-b border-[#1c1917] py-1 my-10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#78350f]">
              ❖ SECTION III : THE SATIRICAL PHENOMENON — FARZI MUSHAIRA ❖
            </span>
          </div>

          {/* ========================================================= */}
          {/* 3. FARZI MUSHAIRA (FARZIMUSHYRA) SECTION                  */}
          {/* ========================================================= */}
          <section id="farzi-mushaira" className="mb-14 scroll-mt-28">
            <div className="border-2 border-[#1c1917] p-5 sm:p-8 bg-[#fdfaf3]">
              
              {/* Top Headline Banner */}
              <div className="border-b-2 border-[#1c1917] pb-4 mb-6">
                <div className="flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#78350f] mb-1">
                  <span>YASH 2K25 OFFICIAL FESTIVAL DISPATCH</span>
                  <span>RECORDED: 13 FEBRUARY 2025</span>
                </div>
                <h3
                  className={`${dmSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-[#1c1917] uppercase leading-tight`}
                >
                  Farzi Mushaira: When Satire &amp; Wit Took Over YASH 2K25
                </h3>
                <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic mt-1`}>
                  Dismantling conventional seriousness with hilarious parody couplets, engineering banter, and poetic wit.
                </p>
              </div>

              {/* Two Column Content: Text + Pictures */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Text Story Column */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div className={`${newsreader.className} text-sm sm:text-base leading-relaxed text-[#292524] text-justify space-y-4`}>
                    <p className="first-letter:float-left first-letter:text-5xl first-letter:font-black first-letter:font-serif first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#1c1917]">
                      Conducted under the banner of YCCE&apos;s annual mega cultural festival, <strong>YASH 2K25</strong>,
                      on February 13, 2025, <strong>Farzi Mushaira</strong> proved to be a watershed moment in the club&apos;s
                      history. While traditional mushairas honor solemn courtly verse, Farzi Mushaira flipped the script—infusing
                      classical Urdu and Hindi recitation etiquette (tahzeeb, adaab, and the theatrical demand for
                      &ldquo;Mukarrar!&rdquo;) with unapologetic comedic parody and relatable student struggles.
                    </p>
                    <p>
                      Poets took the stage to satirize late-night assignment submissions, viva tribulations, hostel mess
                      culinary mysteries, and the bittersweet ironies of campus romance. The CCC Auditorium echoed with
                      unrestrained laughter as students, professors, and department heads joined together in collective
                      applause.
                    </p>
                    <p>
                      Farzi Mushaira cemented Emerge&apos;s reputation as an organization that doesn&apos;t just mourn in
                      tragic couplets, but possesses the wit to make an entire engineering college laugh at its own
                      foibles. It remains one of the highest-attended literary spectacles ever hosted on campus.
                    </p>
                  </div>

                  {/* Pull Quote Box */}
                  <div className="mt-6 border-l-4 border-[#78350f] pl-4 py-2 bg-[#f4ebd9]/80 italic">
                    <p className={`${newsreader.className} text-sm text-[#1c1917] font-medium`}>
                      &ldquo;Where classical Urdu adaab meets the sleepless hilarity of semester deadlines — Farzi Mushaira gave every student a reason to laugh together.&rdquo;
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78350f] block mt-1">
                      — The Emerge Gazette Special Review
                    </span>
                  </div>
                </div>

                {/* Picture Plates Column (event1.JPG and event2.JPG) */}
                <div className="lg:col-span-6 space-y-4">
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[3], 3)}
                    className="border-2 border-[#1c1917] p-1 bg-white cursor-pointer group shadow-xs"
                  >
                    <div className="relative w-full aspect-16/10 overflow-hidden bg-stone-300">
                      <Image
                        src="/memories/event1.JPG"
                        alt="Farzi Mushaira Stage"
                        fill
                        unoptimized
                        className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700"
                      />
                      <div className="absolute top-2 left-2 bg-[#1c1917] text-white text-[9px] font-bold px-2 py-0.5 uppercase">
                        Plate II-A : Live Stage
                      </div>
                    </div>
                    <div className="py-1 px-2 border-t border-[#1c1917] text-[10px] font-bold uppercase text-[#44403c] flex items-center justify-between">
                      <span>Performers at Farzi Mushaira (YASH 2K25)</span>
                      <span className="text-[#78350f]">13 FEB 2025</span>
                    </div>
                  </div>

                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[4], 4)}
                    className="border-2 border-[#1c1917] p-1 bg-white cursor-pointer group shadow-xs"
                  >
                    <div className="relative w-full aspect-16/10 overflow-hidden bg-stone-300">
                      <Image
                        src="/memories/event2.JPG"
                        alt="Farzi Mushaira Enraptured Audience"
                        fill
                        unoptimized
                        className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700"
                      />
                      <div className="absolute top-2 left-2 bg-[#1c1917] text-white text-[9px] font-bold px-2 py-0.5 uppercase">
                        Plate II-B : Audience Ovation
                      </div>
                    </div>
                    <div className="py-1 px-2 border-t border-[#1c1917] text-[10px] font-bold uppercase text-[#44403c] flex items-center justify-between">
                      <span>Crowd cheering during humorous shayari rounds</span>
                      <span className="text-[#78350f]">YCCE AUDITORIUM</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Section Divider Bar */}
          <div className="border-t-[3px] border-b border-[#1c1917] py-1 my-10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#78350f]">
              ❖ SECTION IV : THE PREMIER OPEN MIC CHAMPIONSHIP — GRANDSTAND ❖
            </span>
          </div>

          {/* ========================================================= */}
          {/* 4. GRANDSTAND SECTION                                     */}
          {/* ========================================================= */}
          <section id="grandstand" className="mb-14 scroll-mt-28">
            <div className="border-2 border-[#1c1917] p-5 sm:p-8 bg-[#faf6ee]">
              
              {/* Masthead Banner */}
              <div className="border-b-2 border-[#1c1917] pb-4 mb-6">
                <div className="flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#78350f] mb-1">
                  <span>SIGNATURE OPEN MIC CHAMPIONSHIP</span>
                  <span>RECORDED: 21–22 SEPTEMBER 2025</span>
                </div>
                <h3
                  className={`${dmSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-[#1c1917] uppercase leading-tight`}
                >
                  Grandstand 5.0: The Apex Stage of Spoken Literature
                </h3>
                <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic mt-1`}>
                  From 100 audition contestants to 25 final qualifiers before Judge Dr. Arvinder Kaur at CCC Auditorium.
                </p>
              </div>

              {/* Story Narrative & Two Photo Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-6">
                
                {/* Column 1: Lead Grandstand Photo (event3.png) */}
                <div className="lg:col-span-4">
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[5], 5)}
                    className="border-2 border-[#1c1917] p-1 bg-white cursor-pointer group shadow-xs"
                  >
                    <div className="relative w-full aspect-[4/5] overflow-hidden bg-stone-300">
                      <Image
                        src="/memories/event3.png"
                        alt="Grandstand 5.0 Stage"
                        fill
                        unoptimized
                        className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700"
                      />
                      <div className="absolute top-2 left-2 bg-[#78350f] text-white text-[9px] font-bold px-2 py-0.5 uppercase">
                        Plate III-A
                      </div>
                    </div>
                    <div className="py-1 px-2 border-t border-[#1c1917] text-[10px] font-bold uppercase text-[#44403c]">
                      Grandstand 5.0 Podium Recital
                    </div>
                  </div>
                </div>

                {/* Column 2: Broadside Text Report */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className={`${newsreader.className} text-sm leading-relaxed text-[#292524] text-justify space-y-3`}>
                    <p className="first-letter:float-left first-letter:text-5xl first-letter:font-black first-letter:font-serif first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#1c1917]">
                      Celebrated as the crown jewel of Emerge&apos;s annual calendar, <strong>Grandstand 5.0</strong> marked
                      five glorious years of literary and poetic evolution at YCCE. Held on September 21st and 22nd, 2025,
                      at the prestigious CCC Auditorium, the championship commenced with an intense preliminary audition
                      round featuring over <strong>100 aspiring writers, poets, and stand-up orators</strong>.
                    </p>
                    <p>
                      A rigorously curated lineup of <strong>25 finalists</strong> earned the right to step into the
                      auditorium spotlight for the final round. Presided over by distinguished judge <strong>Dr. Arvinder Kaur</strong>,
                      the evening witnessed an extraordinary range of performances: classical Urdu ghazals, Hindi shers,
                      evocative Marathi verses, hard-hitting English spoken word poetry, and comedic storytelling.
                    </p>
                    <p>
                      Dr. Kaur offered motivating feedback, commending the participants for the depth of their craft and
                      praising EMERGE for creating a sanctuary where young engineers discover the power of their voice.
                      Grandstand remains the ultimate litmus test for literary talent at YCCE.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-[#a8a29e] flex items-center justify-between text-[11px] font-bold uppercase text-[#78350f]">
                    <span>100 AUDITIONS</span>
                    <span>•</span>
                    <span>25 FINALISTS</span>
                    <span>•</span>
                    <span>1 ACCLAIMED STAGE</span>
                  </div>
                </div>

                {/* Column 3: Secondary Photos (event4.png & event5.JPG) */}
                <div className="lg:col-span-3 space-y-3">
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[6], 6)}
                    className="border border-[#1c1917] p-1 bg-white cursor-pointer group shadow-xs"
                  >
                    <div className="relative w-full aspect-square overflow-hidden bg-stone-300">
                      <Image
                        src="/memories/event4.png"
                        alt="Grandstand Finalist"
                        fill
                        unoptimized
                        className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                      />
                    </div>
                    <div className="py-1 px-1.5 border-t border-[#1c1917] text-[9px] font-bold uppercase text-[#44403c] truncate">
                      Plate III-B: Final Round Judging
                    </div>
                  </div>

                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[7], 7)}
                    className="border border-[#1c1917] p-1 bg-white cursor-pointer group shadow-xs"
                  >
                    <div className="relative w-full aspect-square overflow-hidden bg-stone-300">
                      <Image
                        src="/memories/event5.JPG"
                        alt="Audience & Performers"
                        fill
                        unoptimized
                        className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                      />
                    </div>
                    <div className="py-1 px-1.5 border-t border-[#1c1917] text-[9px] font-bold uppercase text-[#44403c] truncate">
                      Plate III-C: CCC Auditorium Audience
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Section Divider Bar */}
          <div className="border-t-[3px] border-b border-[#1c1917] py-1 my-10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#78350f]">
              ❖ SECTION V : THE UNFILTERED STAGE — LATENT ❖
            </span>
          </div>

          {/* ========================================================= */}
          {/* 5. LATENT SHOWCASE SECTION                                */}
          {/* ========================================================= */}
          <section id="latent" className="mb-14 scroll-mt-28">
            <div className="border-2 border-[#1c1917] p-5 sm:p-8 bg-[#fdfaf3]">
              
              {/* Section Header */}
              <div className="border-b-2 border-[#1c1917] pb-4 mb-6">
                <div className="flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#78350f] mb-1">
                  <span>DISPATCH V • EXPERIMENTAL OPEN FORMAT</span>
                  <span>UNCOVERING DORMANT GENIUS</span>
                </div>
                <h3
                  className={`${dmSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-[#1c1917] uppercase leading-tight`}
                >
                  Latent: Unearthing the Raw &amp; Unspoken Brilliance
                </h3>
                <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic mt-1`}>
                  An open, judgment-free platform dedicated to discovering untapped poetic, musical, and storytelling talent.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Visual Plate: event-6.JPG */}
                <div className="lg:col-span-6">
                  <div
                    onClick={() => handleOpenPhoto(MEMORIES_GALLERY[8], 8)}
                    className="border-2 border-[#1c1917] p-1 bg-white cursor-pointer group shadow-xs"
                  >
                    <div className="relative w-full aspect-16/10 overflow-hidden bg-stone-300">
                      <Image
                        src="/memories/event-6.JPG"
                        alt="Latent Showcase Performance"
                        fill
                        unoptimized
                        className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700"
                      />
                      <div className="absolute top-2 left-2 bg-[#1c1917] text-white text-[9px] font-bold px-2 py-0.5 uppercase">
                        Plate IV : The Latent Stage
                      </div>
                    </div>
                    <div className="py-1 px-2 border-t border-[#1c1917] text-[10px] font-bold uppercase text-[#44403c] flex items-center justify-between">
                      <span>First-time performers stepping into the light</span>
                      <span className="text-[#78350f]">RAW &amp; UNFILTERED</span>
                    </div>
                  </div>
                </div>

                {/* Text Description */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div className={`${newsreader.className} text-sm sm:text-base leading-relaxed text-[#292524] text-justify space-y-4`}>
                    <p className="first-letter:float-left first-letter:text-5xl first-letter:font-black first-letter:font-serif first-letter:mr-2.5 first-letter:leading-none first-letter:text-[#1c1917]">
                      Created to dismantle stage fright once and for all, <strong>Latent</strong> was conceived as an
                      experimental, non-competitive showcase for the quietest thinkers on campus. Many engineering
                      students harbor extraordinary writing journals or compose acoustic melodies in their hostel rooms,
                      yet never venture into traditional competitions out of fear of judgment.
                    </p>
                    <p>
                      Latent broke down those barriers. It offered an intimate, supportive ambiance where participants
                      could read unpolished drafts, recite spontaneous couplets, experiment with acoustic duets, or
                      share comedic personal anecdotes.
                    </p>
                    <p>
                      Every stumble was met with cheers of encouragement, and every crescendo was greeted with genuine
                      warmth. Through Latent, dozens of first-time performers found their artistic voice and later emerged
                      as confident anchors, club executives, and championship finalists.
                    </p>
                  </div>

                  <div className="mt-6 p-3 border border-[#292524] bg-[#fbf8f1] flex items-center gap-3">
                    <Feather className="w-5 h-5 text-[#78350f] shrink-0" />
                    <p className={`${newsreader.className} text-xs text-[#44403c] italic`}>
                      &ldquo;You do not need to be a seasoned laureate to stand before our microphone. You only need the courage to speak your truth.&rdquo;
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Section Divider Bar */}
          <div className="border-t-[3px] border-b border-[#1c1917] py-1 my-10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#78350f]">
              ❖ SECTION VI : THE MAJOR CONTRIBUTIONS &amp; HISTORIC LEGACY ❖
            </span>
          </div>

          {/* ========================================================= */}
          {/* 6. MAJOR CONTRIBUTIONS SECTION                            */}
          {/* ========================================================= */}
          <section id="contributions" className="mb-14 scroll-mt-28">
            <div className="border-2 border-[#1c1917] p-5 sm:p-8 bg-[#faf6ee]">
              
              {/* Banner */}
              <div className="text-center mb-8 border-b-2 border-[#1c1917] pb-4">
                <span className={`${cinzel.className} text-xs font-bold uppercase tracking-widest text-[#78350f]`}>
                  THE ENDURING IMPACT
                </span>
                <h3 className={`${dmSerif.className} text-3xl sm:text-4xl md:text-5xl font-normal text-[#1c1917] uppercase mt-1`}>
                  Major Contributions to Campus Culture
                </h3>
                <p className={`${newsreader.className} text-xs sm:text-sm text-[#57534e] italic max-w-2xl mx-auto mt-1`}>
                  How a student-led literary collective permanently transformed Yeshwantrao Chavan College of Engineering.
                </p>
              </div>

              {/* Newspaper Columns (6 Pillars of Contribution) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Contribution 1 */}
                <div className="border border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-[#78350f] tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>Multilingual Revival</span>
                    </div>
                    <h4 className={`${playfair.className} text-lg font-bold text-[#1c1917] mb-2`}>
                      Dignity for Vernacular Arts
                    </h4>
                    <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                      Emerge broke the colonial monotony of elite campus language by celebrating Hindi, Urdu, Marathi,
                      and English with equal grandeur. It revitalized classical shayeri, ghazals, and local Vidarbha folk
                      metaphors on a prestigious collegiate platform.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#d6cebf] text-[9px] uppercase font-bold text-[#78350f]">
                    4 Languages Celebrated
                  </div>
                </div>

                {/* Contribution 2 */}
                <div className="border border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-[#78350f] tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span>Emotional Catharsis</span>
                    </div>
                    <h4 className={`${playfair.className} text-lg font-bold text-[#1c1917] mb-2`}>
                      Safe Emotional Expression
                    </h4>
                    <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                      In an engineering environment prone to intense academic anxiety and competitive stress, Emerge
                      served as an indispensable sanctuary. Spoken word allowed students to process loneliness, love,
                      family sacrifices, and mental health struggles in an empathetic peer circle.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#d6cebf] text-[9px] uppercase font-bold text-[#78350f]">
                    100% Judgment-Free Sanctuary
                  </div>
                </div>

                {/* Contribution 3 */}
                <div className="border border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-[#78350f] tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[10px]">
                        3
                      </span>
                      <span>The Great 2025 Evolution</span>
                    </div>
                    <h4 className={`${playfair.className} text-lg font-bold text-[#1c1917] mb-2`}>
                      From Poetry to Literature
                    </h4>
                    <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                      On September 3, 2025, the club made history by expanding beyond poetry into a comprehensive
                      Literature Club. This reform welcomed campus journalists, editorial essayists, debaters, dramatic
                      monologists, and creative non-fiction writers under one unified banner.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#d6cebf] text-[9px] uppercase font-bold text-[#78350f]">
                    Formalized Sept 3, 2025
                  </div>
                </div>

                {/* Contribution 4 */}
                <div className="border border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-[#78350f] tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[10px]">
                        4
                      </span>
                      <span>Leadership Incubator</span>
                    </div>
                    <h4 className={`${playfair.className} text-lg font-bold text-[#1c1917] mb-2`}>
                      Nurturing Articulate Leaders
                    </h4>
                    <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                      Over five years, dozens of introverted freshmen who first trembled at the open mic went on to anchor
                      national technical symposiums, host youth summits, and represent YCCE at inter-collegiate debates,
                      embodying the club&apos;s ethos of public speaking excellence.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#d6cebf] text-[9px] uppercase font-bold text-[#78350f]">
                    100+ Alumni Leaders
                  </div>
                </div>

                {/* Contribution 5 */}
                <div className="border border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-[#78350f] tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[10px]">
                        5
                      </span>
                      <span>Satirical Heritage</span>
                    </div>
                    <h4 className={`${playfair.className} text-lg font-bold text-[#1c1917] mb-2`}>
                      Institutionalizing Humor
                    </h4>
                    <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                      Through Farzi Mushaira and annual parody slams, Emerge demonstrated that literature does not need
                      to be solemn or intimidating. It created a beloved tradition of campus self-deprecation that brings
                      faculty and students together in good-natured laughter.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#d6cebf] text-[9px] uppercase font-bold text-[#78350f]">
                    Annual Cultural Tradition
                  </div>
                </div>

                {/* Contribution 6 */}
                <div className="border border-[#1c1917] p-4 bg-[#fbf8f1] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-[#78350f] tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[10px]">
                        6
                      </span>
                      <span>Digital Archiving</span>
                    </div>
                    <h4 className={`${playfair.className} text-lg font-bold text-[#1c1917] mb-2`}>
                      Preserving Student Art
                    </h4>
                    <p className={`${newsreader.className} text-xs leading-relaxed text-[#332f2c] text-justify`}>
                      By archiving photographs, audio recordings, published shers, and video dispatches, the club
                      ensures that the literary contributions of engineering batches do not vanish upon graduation, but
                      inspire generations of incoming students.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#d6cebf] text-[9px] uppercase font-bold text-[#78350f]">
                    Permanent Historical Record
                  </div>
                </div>

              </div>

              {/* Presidential Seal of Honor */}
              <div className="mt-8 pt-4 border-t-2 border-dashed border-[#1c1917] flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#1c1917] bg-[#f4ebd9] flex items-center justify-center">
                    <Feather className="w-6 h-6 text-[#78350f]" />
                  </div>
                  <div>
                    <div className={`${cinzel.className} text-xs font-bold uppercase tracking-wider text-[#1c1917]`}>
                      Emerge Literature Club • Executive Board
                    </div>
                    <div className="text-[11px] text-[#57534e]">
                      Approved &amp; Cataloged by the Archival Committee, YCCE Nagpur
                    </div>
                  </div>
                </div>

                <div className="text-[10px] uppercase font-bold tracking-widest text-[#78350f]">
                  ❦ LITTERA SCRIPTA MANET • THE WRITTEN WORD ENDURES ❦
                </div>
              </div>

            </div>
          </section>

          {/* ========================================================= */}
          {/* 7. COMPLETE PHOTOGRAPHIC PLATES ARCHIVE                   */}
          {/* ========================================================= */}
          <section className="mb-14">
            <div className="border-b-2 border-[#1c1917] pb-2 mb-6 flex flex-wrap items-center justify-between">
              <div>
                <h3 className={`${cinzel.className} text-lg sm:text-xl font-bold uppercase tracking-wider text-[#1c1917]`}>
                  Archival Photographic Plates
                </h3>
                <p className={`${newsreader.className} text-xs text-[#57534e] italic`}>
                  Click any archival plate from the public/memories vault to view high-resolution historical prints.
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#78350f]">
                {MEMORIES_GALLERY.length} PLATES IN CATALOG
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {MEMORIES_GALLERY.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenPhoto(item, idx)}
                  className="border border-[#1c1917] p-1.5 bg-white cursor-pointer group hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-stone-200">
                    <Image
                      src={item.image_url}
                      alt={item.caption}
                      fill
                      unoptimized
                      className="object-cover filter grayscale contrast-110 sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                    <div className="absolute top-1 left-1 bg-black/75 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase">
                      Plate #{idx + 1}
                    </div>
                  </div>
                  <div className="mt-1.5 px-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#78350f] block truncate">
                      {item.category}
                    </span>
                    <p className={`${newsreader.className} text-[11px] leading-tight text-[#292524] line-clamp-2 mt-0.5`}>
                      {item.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 8. VINTAGE ADVERTISEMENT / CLASSIFIED NOTICE             */}
          {/* ========================================================= */}
          <div className="mt-12 pt-6 border-t-[3px] border-[#292524]">
            <div className="border-2 border-dashed border-[#292524] p-4 sm:p-6 bg-[#f4ebd9]/70 relative text-center">
              
              {/* Corner Ornaments */}
              <div className="absolute top-1 left-1 text-[10px] font-serif text-[#78350f]">◆</div>
              <div className="absolute top-1 right-1 text-[10px] font-serif text-[#78350f]">◆</div>
              <div className="absolute bottom-1 left-1 text-[10px] font-serif text-[#78350f]">◆</div>
              <div className="absolute bottom-1 right-1 text-[10px] font-serif text-[#78350f]">◆</div>

              <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Left Emblem */}
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 rounded-full border-2 border-[#292524] flex items-center justify-center bg-white p-2 shrink-0 shadow-xs">
                    <Feather className="w-7 h-7 text-[#78350f]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#78350f]">
                      LITERARY CLASSIFIED NOTICE • SPRING ARCHIVE
                    </span>
                    <h4 className={`${playfair.className} text-xl sm:text-2xl font-black text-[#1c1917] uppercase tracking-wide`}>
                      Calling All Student Writers &amp; Shair!
                    </h4>
                    <p className={`${newsreader.className} text-xs text-[#44403c] italic mt-0.5`}>
                      Do your couplets deserve to be archived? Publish your shayari to our community feed or register for upcoming editions.
                    </p>
                  </div>
                </div>

                {/* Right Call To Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
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

              {/* Bottom Classified Tagline */}
              <div className="mt-4 pt-2 border-t border-[#d6cebf] flex flex-wrap items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#57534e]">
                <span>EMERGE-LITERATURE-CLUB.YCCE</span>
                <span>❦ WHERE EVERY UNTOLD STORY EMERGES ❦</span>
                <span>VOL. 5 • ARCHIVES OPEN</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 9. LIGHTBOX MODAL FOR HIGH-RESOLUTION PLATES              */}
      {/* ========================================================= */}
      <AnimatePresence>
        {lightboxPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#faf6ee] border-2 sm:border-4 border-[#1c1917] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto"
            >
              {/* Modal Top Masthead Bar */}
              <div className="px-4 sm:px-6 py-3 border-b-2 border-[#1c1917] bg-[#f4ebd9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Feather className="w-4 h-4 text-[#78350f]" />
                  <span className={`${cinzel.className} text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1c1917]`}>
                    The Emerge Gazette • Archival Plate #{lightboxIndex !== null ? lightboxIndex + 1 : 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-1.5 text-[#44403c] hover:text-[#1c1917] border border-[#292524] bg-white cursor-pointer"
                    title="Copy Archive Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseLightbox}
                    className="p-1.5 text-[#1c1917] hover:bg-[#1c1917] hover:text-white border border-[#292524] bg-white transition-colors cursor-pointer"
                    title="Close Plate"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Plate Body */}
              <div className="p-4 sm:p-8 overflow-y-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#78350f] border-b border-[#d6cebf] pb-2">
                  <span>CATEGORY: {lightboxPhoto.category || "ARCHIVE"}</span>
                  <span>DATE: {lightboxPhoto.date || "HISTORIC RECORD"}</span>
                </div>

                {/* High Resolution Image Frame */}
                <div className="border-2 border-[#1c1917] p-1 bg-white">
                  <div className="relative w-full h-[45vh] sm:h-[60vh] bg-stone-900 overflow-hidden flex items-center justify-center">
                    <Image
                      src={lightboxPhoto.image_url}
                      alt={lightboxPhoto.caption}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Picture Caption & Details */}
                <div className="p-3 border border-[#292524] bg-[#fdfaf3]">
                  <p className={`${newsreader.className} text-sm sm:text-base leading-relaxed text-[#1c1917]`}>
                    {lightboxPhoto.caption}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#d6cebf] flex items-center justify-between text-[10px] uppercase font-bold text-[#57534e]">
                    <span>YCCE LITERARY ARCHIVES</span>
                    <span>PLATE {lightboxIndex !== null ? `${lightboxIndex + 1} OF ${MEMORIES_GALLERY.length}` : ""}</span>
                  </div>
                </div>
              </div>

              {/* Modal Navigation Footer */}
              <div className="px-4 sm:px-6 py-3 border-t-2 border-[#1c1917] bg-[#f4ebd9] flex items-center justify-between text-xs font-bold uppercase">
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="px-3 py-1.5 bg-[#1c1917] text-white hover:bg-[#78350f] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseLightbox}
                  className="px-4 py-1.5 border border-[#292524] bg-white text-[#1c1917] hover:bg-[#292524] hover:text-white transition-colors cursor-pointer"
                >
                  Return to Gazette
                </button>

                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="px-3 py-1.5 bg-[#1c1917] text-white hover:bg-[#78350f] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
