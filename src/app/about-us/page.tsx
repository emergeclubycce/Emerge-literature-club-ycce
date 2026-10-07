"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import {
  Quote,
  Sparkles,
  Feather,
  Mic,
  BookOpen,
  Trophy,
  Users,
  Compass,
  ArrowRight,
  Heart,
  Calendar,
  Award,
  ExternalLink,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { useLenis } from "@/utils/lenis";
import Footer from "../components/reuseable/reusable-home/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function AboutUsPage() {
  useLenis();
  const [presidentImgLoaded, setPresidentImgLoaded] = useState(false);
  const [teamImgLoaded, setTeamImgLoaded] = useState(false);

  return (
    <>
      <main
        className={`${inter.className} min-h-screen w-full bg-linear-to-b from-[#fbfbfa] via-white to-[#fbfbfa] text-zinc-900 pt-28 pb-20 px-4 sm:px-6 lg:px-12 selection:bg-sky-100 selection:text-sky-800`}
      >
        {/* ========================================================= */}
        {/* 1. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto text-center pt-4 sm:pt-10 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Est. June 21, 2020 • YCCE Nagpur</span>
          </div>

          {/* Main Title */}
          <h1
            className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-tight mb-6`}
          >
            The Living Voice of{" "}
            <span className="text-sky-500 italic">Literature &amp; Spoken Art</span>{" "}
            at YCCE
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-zinc-600 font-normal leading-relaxed mb-10">
            Welcome to <span className="font-semibold text-zinc-800">Emerge</span> — where engineers become poets, thinkers become orators, and unspoken emotions find their true stage.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-500">5+</span>
              <span className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Years of Legacy</span>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-500">25+</span>
              <span className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Signature Gatherings</span>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-500">500+</span>
              <span className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Verses &amp; Stories</span>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-500">100+</span>
              <span className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Active Writers &amp; Artists</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. EMERGE FAMILY BANNER SECTION                           */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto mb-20">
          <div className="relative rounded-3xl overflow-hidden border border-gray-200/90 shadow-xl bg-white p-2.5 sm:p-4">
            <div className="relative w-full aspect-16/10 sm:aspect-16/9 md:aspect-21/10 rounded-2xl overflow-hidden bg-zinc-100">
              {!teamImgLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <Image
                src="/image/team.jpg"
                alt="Emerge Literature Club Team &amp; Family"
                fill
                sizes="(max-width: 1024px) 100vw, 1100px"
                priority
                className={`object-cover transition-opacity duration-700 ${teamImgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setTeamImgLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                <span className="text-xs sm:text-sm uppercase tracking-wider text-sky-300 font-semibold mb-1">
                  The Hearts &amp; Minds Behind The Movement
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  The Emerge Family
                </h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-xl mt-1 hidden sm:block">
                  A united collective of passionate student writers, artists, directors, coordinators, and visionaries shaping campus culture at YCCE.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. PRESIDENT'S ADDRESS & PROFILE SPOTLIGHT                */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-semibold text-sky-500">
              Club Leadership Note
            </span>
            <h2 className={`${playfair.className} text-3xl sm:text-4xl font-bold text-zinc-900 mt-2`}>
              Founder&apos;s Message
            </h2>
            <div className="w-16 h-1 bg-sky-500 rounded-full mx-auto mt-3" />
          </div>

          <div className="relative rounded-3xl bg-linear-to-br from-white via-sky-50/20 to-white border border-sky-100 shadow-xl overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* President Portrait Column */}
              <div className="lg:col-span-4 flex flex-col items-center text-center">
                <div className="relative w-48 sm:w-56 h-64 sm:h-72 rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-zinc-100 group">
                  {!presidentImgLoaded && (
                    <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
                  )}
                  <Image
                    src="/Team-images/Gyanesh Pande.png"
                    alt="Jagdish Kachhawah - President, Emerge Literature Club"
                    fill
                    sizes="(max-width: 640px) 200px, 250px"
                    className={`object-cover transition-all duration-500 group-hover:scale-105 ${presidentImgLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setPresidentImgLoaded(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                    <span className="text-white text-xs font-semibold">President 2020</span>
                  </div>
                </div>

                {/* Identity */}
                <h3 className="text-xl font-bold text-zinc-900 mt-4">
                  Gyanesh Pandey
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-sky-600">
                  Founder of Emerge Literature Club
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                  <span>YCCE Nagpur</span>
                </div>

                {/* President Social Links */}
                {/* <div className="flex items-center gap-3 mt-4">
                  <a
                    href="https://www.linkedin.com/in/jagdish-kachhawah-21jk?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-sky-700 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"
                    title="Connect on LinkedIn"
                    aria-label="President LinkedIn"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/mc_sukuna?igsh=MXBkY3J5NTAxYm41"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-all cursor-pointer"
                    title="Follow on Instagram"
                    aria-label="President Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div> */}
              </div>

              {/* Message Column */}
              <div className="lg:col-span-8 flex flex-col justify-center">
                <Quote className="w-10 h-10 text-sky-400/40 mb-3" />
                <blockquote className={`${playfair.className} text-xl sm:text-2xl text-zinc-800 font-medium leading-relaxed mb-6 italic`}>
                  &ldquo;Literature isn&apos;t just about ancient books or rhyming meters; it is the living pulse of who we are, the courage to speak our unspoken truths, and the stage where every voice finds belonging.&rdquo;
                </blockquote>

                <div className="space-y-4 text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
                  <p>
                    When <span className="font-semibold text-zinc-800">Emerge</span> was founded in the summer of 2020, we had one conviction: that within every technical student at YCCE, there lives an artist waiting for an audience. In an environment often defined by formulas, codes, and lectures, poetry and literature provide the rhythm that keeps our humanity alive.
                  </p>
                  <p>
                    From the satirical wit of our annual <span className="font-semibold text-zinc-800">Farzi Mushaira</span> to the raw emotional resonance of <span className="font-semibold text-zinc-800">Antotgatva</span> and <span className="font-semibold text-zinc-800">Grandstand</span>, we have built a non-judgmental space where first-time open mic participants stand shoulder-to-shoulder with seasoned writers.
                  </p>
                  <p>
                    As President, I am proud to lead an extraordinary council of writers, directors, and creatives who pour their hearts into every event. Whether you write in Hindi, Urdu, Marathi, or English — whether you perform shers, tell tales, or simply love listening from the back row — you have a home in Emerge.
                  </p>
                </div>

                {/* Presidential Signature Accent */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                      Official Address
                    </p>
                    <p className="text-sm font-bold text-zinc-800">
                     Gyanesh Pandey, Founder
                    </p>
                  </div>

                  <Link
                    href="/team"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Meet the Full Executive Team</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. OUR STORY & FOUNDATION JOURNEY                         */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest font-semibold text-sky-500">
              The Genesis
            </span>
            <h2 className={`${playfair.className} text-3xl sm:text-4xl font-bold text-zinc-900 mt-2`}>
              Our Story &amp; Heritage
            </h2>
            <div className="w-16 h-1 bg-sky-500 rounded-full mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Story Card 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5">
                  <Feather className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                  June 2020: The Spark
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-1 mb-3">
                  Born in the Heart of Lockdown
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  On June 21, 2020, amidst global uncertainty and physical distancing, a small group of visionary YCCE students created an online circle for heartfelt expression. What started as virtual poetry readings quickly resonated with hundreds of students yearning for connection, vulnerability, and art.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-zinc-500">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Foundation: June 21, 2020 • Logo Unveiled: July 11, 2020</span>
              </div>
            </div>

            {/* Story Card 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  September 2025: The Evolution
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-1 mb-3">
                  From Poetry to Complete Literature
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Originally recognized as the &quot;Emerge Poetry Club&quot;, our horizon widened with each passing milestone. On September 3, 2025, the club formally rebranded to the <span className="font-semibold text-zinc-800">Emerge Literature Club</span> to encompass the full spectrum of literary arts — including storytelling, debates, journalism, dramatics, satire, and multilingual anthologies.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-zinc-500">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Expanded Horizons: Mushairas, Open Mics, Debates &amp; Anthologies</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. THE FOUR PILLARS OF EMERGE                            */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest font-semibold text-sky-500">
              Core Tenets
            </span>
            <h2 className={`${playfair.className} text-3xl sm:text-4xl font-bold text-zinc-900 mt-2`}>
              What We Stand For
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 max-w-xl mx-auto mt-2">
              Every initiative, open mic, and workshop at Emerge is guided by our four core pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-sky-300 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                Spoken Word &amp; Open Mics
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Platforming fearless orators through flagship events like Farzi Mushaira, Antotgatva, and Grandstand on the campus mainstage.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-sky-300 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Feather className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                Creative Writing &amp; Shers
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Preserving the art of shayaris, ghazals, verses, and micro-prose across Hindi, Urdu, Marathi, and English.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-sky-300 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                Competitive Excellence
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Hosting high-caliber college-wide slam competitions, debating forums, and literary showdowns with recognition and certificates.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:border-sky-300 hover:shadow-md transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                Inclusive Community
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Fostering an ego-free, welcoming atmosphere where both novices and seasoned laureates grow together through mutual encouragement.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. LEADERSHIP WINGS & STRUCTURE                          */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto mb-24">
          <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-b from-zinc-900 to-zinc-950 text-white shadow-2xl">
            <div className="max-w-3xl">
              <span className="text-xs uppercase tracking-widest font-semibold text-sky-400">
                Structure &amp; Governance
              </span>
              <h2 className={`${playfair.className} text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4`}>
                Powered by Student Leadership
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
                Emerge operates across specialized functional wings managed by dedicated student coordinators, heads, and vice presidents. Together, they orchestrate large-scale events, curate online literary magazines, and engineer web platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <h4 className="text-base font-bold text-white mb-1">
                  Literary &amp; Editorial Wing
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Curates submissions, judges competitions, proofreads chronicles, and oversees spoken word quality.
                </p>
                <span className="text-[11px] font-semibold text-sky-400">
                  Led by Literary VP &amp; Literature Heads
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <h4 className="text-base font-bold text-white mb-1">
                  Events &amp; Stage Hospitality
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Directs sound, stage design, auditorium booking, anchors, artist flow, and guest hospitality.
                </p>
                <span className="text-[11px] font-semibold text-sky-400">
                  Led by Event Directors &amp; Hospitality VP
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <h4 className="text-base font-bold text-white mb-1">
                  Tech, Media &amp; Visual Arts
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Builds web systems, documents archives in photography, and broadcasts visual identity across social channels.
                </p>
                <span className="text-[11px] font-semibold text-sky-400">
                  Led by Tech Head &amp; Media Council
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-zinc-400">
                Want to see all coordinators, vice presidents, and technical contributors?
              </span>
              <Link
                href="/team"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <span>View Full Team Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. CAMPUS AFFILIATION & LOCATION                         */}
        {/* ========================================================= */}
        <section className="max-w-5xl mx-auto mb-20 text-center">
          <div className="p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              Yeshwantrao Chavan College of Engineering (YCCE)
            </h3>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Hingna Road, Wanadongri, Nagpur, Maharashtra 441110. Emerge proudly represents the vibrant literary spirit of YCCE students across branches and academic years.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shers"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Explore Shayari &amp; Poems</span>
              </Link>

              <Link
                href="/event"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-zinc-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                <span>Upcoming Gatherings</span>
              </Link>

              <Link
                href="/shers/submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Submit Your Work</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
