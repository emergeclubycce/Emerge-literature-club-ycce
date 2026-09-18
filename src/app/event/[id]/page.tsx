"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Inter, Playfair_Display } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "@/config/supabase";
import { useLenis } from "@/utils/lenis";
import Footer from "../../components/reuseable/reusable-home/Footer";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Share2,
  Check,
  Sparkles,
  MapPin,
  Users,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Bookmark,
  CalendarDays,
  Info,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

interface ClubEvent {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  event_date: string | null;
  registration_enabled: boolean;
  registration_url: string | null;
  created_at?: string;
  updated_at?: string;
}

function isValidHttpUrl(string: string | null | undefined): boolean {
  if (!string) return false;
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "Date to be announced";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "TBA";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function EventDetailPage() {
  useLenis();
  const params = useParams();
  const router = useRouter();

  const eventId = params?.id ? Number(params.id) : null;

  const [eventData, setEventData] = useState<ClubEvent | null>(null);
  const [otherEvents, setOtherEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch Event Details & Related Events
  const fetchEventDetails = useCallback(async () => {
    if (!eventId || isNaN(eventId)) {
      setError("Invalid event identifier.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch current event
      const { data, error: eventErr } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventErr || !data) {
        throw new Error(eventErr?.message || "Event record not found.");
      }

      setEventData(data);

      // 2. Fetch other upcoming/recent events for recommendation
      const { data: others } = await supabase
        .from("events")
        .select("*")
        .neq("id", eventId)
        .order("id", { ascending: false })
        .limit(3);

      setOtherEvents(others || []);
    } catch (err: any) {
      console.error("Failed to load event:", err);
      setError(err?.message || "Unable to load event details right now.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  // Share handler
  const handleShare = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const hasValidRegistration =
    eventData?.registration_enabled && isValidHttpUrl(eventData.registration_url);

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-[#faf9f6] text-zinc-900`}
    >
      <div className="w-full max-w-6xl mx-auto pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Top Back & Share Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/event"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200/80 text-xs font-semibold text-zinc-700 hover:text-sky-600 hover:border-sky-300 shadow-xs transition-all active:scale-98 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Events</span>
          </Link>

          {eventData && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200/80 text-xs font-medium text-zinc-700 hover:bg-gray-50 shadow-xs transition-all active:scale-98 cursor-pointer"
                title="Share Event Link"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
            <p className="text-sm font-medium text-zinc-500">
              Gathering event information...
            </p>
          </div>
        ) : error || !eventData ? (
          /* Error State */
          <div className="py-16 px-6 text-center max-w-lg mx-auto bg-white border border-red-100 rounded-3xl p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-800 mb-2">Event Not Found</h2>
            <p className="text-sm text-zinc-500 mb-6">
              {error || "The requested event could not be found or may have been archived."}
            </p>
            <Link
              href="/event"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore All Events</span>
            </Link>
          </div>
        ) : (
          /* Main Event Content */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            {/* Hero Card with Poster & Header Info */}
            <div className="bg-white border border-gray-200/90 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Poster / Media Column */}
                <div className="lg:col-span-5 w-full">
                  <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-gray-200/80 shadow-inner group">
                    <Image
                      src={eventData.image_url || "/image/logo.png"}
                      alt={eventData.title}
                      fill
                      priority
                      unoptimized={eventData.image_url?.startsWith("http") ? true : false}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Badge on Poster */}
                    <div className="absolute top-3.5 left-3.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Emerge Gathering</span>
                      </span>
                    </div>

                    {eventData.event_date && (
                      <div className="absolute bottom-3.5 left-3.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/40 text-zinc-900 text-xs font-bold shadow-sm flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                        <span>{formatShortDate(eventData.event_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details & Action Column */}
                <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
                  <div>
                    {/* Event Category Tag & Date Pill */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg text-xs font-semibold">
                        <Sparkles className="w-3 h-3 text-sky-500" />
                        <span>Literary Event</span>
                      </span>

                      {eventData.registration_enabled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Registration Open</span>
                        </span>
                      )}
                    </div>

                    {/* Main Title */}
                    <h1 className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 tracking-tight leading-snug`}>
                      {eventData.title}
                    </h1>

                    {/* Metadata Strip */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-[#f8f6f0] border border-amber-100/80">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-sky-600 shadow-xs border border-gray-100">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Date</p>
                          <p className="text-xs font-bold text-zinc-800">
                            {formatDisplayDate(eventData.event_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-xs border border-gray-100">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Venue</p>
                          <p className="text-xs font-bold text-zinc-800">
                            YCCE Campus, Nagpur
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-xs border border-gray-100">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Organized By</p>
                          <p className="text-xs font-bold text-zinc-800">
                            Emerge Literature Club
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-xs border border-gray-100">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Entry &amp; Access</p>
                          <p className="text-xs font-bold text-zinc-800">
                            Open to all students
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      About the Event
                    </h3>
                    <div className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line font-normal space-y-2">
                      {eventData.description}
                    </div>
                  </div>

                  {/* Registration CTA Card */}
                  <div className="pt-4 border-t border-gray-100">
                    {hasValidRegistration ? (
                      <div className="space-y-3">
                        <a
                          href={eventData.registration_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <span>Register for Event</span>
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                        <p className="text-center text-[11px] text-zinc-400 font-medium">
                          You will be directed to the official registration form / portal.
                        </p>
                      </div>
                    ) : eventData.registration_enabled ? (
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center">
                        <p className="text-xs font-semibold text-amber-800">
                          Registration portal is opening soon.
                        </p>
                        <p className="text-[11px] text-amber-600 mt-0.5">
                          Stay connected with our club members or social handles for immediate registration access.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs text-zinc-600">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          <span>Direct walk-in entry at the venue (No pre-registration needed).</span>
                        </div>
                        <Link
                          href="/event"
                          className="font-bold text-sky-600 hover:text-sky-700 underline flex-shrink-0 ml-2"
                        >
                          All Events
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Other Events Grid Section */}
            {otherEvents.length > 0 && (
              <div className="pt-6">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <h2 className="text-base sm:text-lg font-bold text-zinc-800">
                      More Gatherings &amp; Events
                    </h2>
                  </div>
                  <Link
                    href="/event"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {otherEvents.map((item) => (
                    <Link
                      key={item.id}
                      href={`/event/${item.id}`}
                      className="group bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all duration-300"
                    >
                      <div>
                        <div className="relative h-44 w-full rounded-xl overflow-hidden bg-gray-100 mb-3">
                          <Image
                            src={item.image_url || "/image/logo.png"}
                            alt={item.title}
                            fill
                            unoptimized={item.image_url?.startsWith("http") ? true : false}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {item.event_date && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                              {formatShortDate(item.event_date)}
                            </div>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-zinc-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-sky-600">
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  );
}
