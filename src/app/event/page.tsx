"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useLenis } from "@/utils/lenis";
import Footer from "../components/reuseable/reusable-home/Footer";
import supabase from "@/config/supabase";
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Layers,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface ClubEvent {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  event_date: string | null; // Format: "YYYY-MM-DD"
  registration_enabled: boolean;
  registration_url: string | null;
  created_at?: string;
  updated_at?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventsPage() {
  const scrollTo = useLenis();

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date(2025, 1, 1));
  const [highlightedEventId, setHighlightedEventId] = useState<number | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: string; items: ClubEvent[] } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch events from Supabase public.events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("events")
        .select("*")
        .order("id", { ascending: true });

      if (err) throw err;
      const loadedEvents = data || [];
      setEvents(loadedEvents);

      // Auto-set calendar month to the earliest event date if available
      const firstDated = loadedEvents.find((e) => e.event_date);
      if (firstDated?.event_date) {
        const [y, m] = firstDated.event_date.split("-").map(Number);
        if (y && m) {
          setCurrentCalendarDate(new Date(y, m - 1, 1));
        }
      }
    } catch (err: any) {
      console.error("Failed to load events from Supabase:", err);
      setError("Unable to load events at this moment. Please check back shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Index events with valid event_date for quick calendar lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ClubEvent[]>();
    events.forEach((ev) => {
      if (ev.event_date) {
        const existing = map.get(ev.event_date) || [];
        existing.push(ev);
        map.set(ev.event_date, existing);
      }
    });
    return map;
  }, [events]);

  const eventsWithDatesCount = useMemo(() => {
    return events.filter((e) => Boolean(e.event_date)).length;
  }, [events]);

  // Calendar month navigation
  const prevMonth = () => {
    setCurrentCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
    setSelectedDateEvents(null);
  };

  const nextMonth = () => {
    setCurrentCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
    setSelectedDateEvents(null);
  };

  // Smooth scroll to an event and highlight card
  const handleScrollToEvent = (eventId: number) => {
    setShowCalendar(false);
    setSelectedDateEvents(null);

    // Give DOM a microtick if modal was open
    setTimeout(() => {
      const targetElement = document.getElementById(`event-${eventId}`);
      if (targetElement) {
        if (typeof scrollTo === "function") {
          scrollTo(targetElement);
        } else {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        setHighlightedEventId(eventId);
        setTimeout(() => {
          setHighlightedEventId(null);
        }, 2600);
      } else {
        setToastMessage("Target event card could not be located on this page.");
        setTimeout(() => setToastMessage(null), 3500);
      }
    }, 50);
  };

  // Calendar Grid calculations for currentCalendarDate
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  return (
    <main
      className={`${inter.className} min-h-screen w-full flex flex-col items-center justify-between bg-gray-50/30`}
    >
      <div className="w-full flex flex-col items-center pt-24 pb-16 px-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="bg-zinc-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Header section with Top-Right Small Calendar Icon */}
        <div className="w-full max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/80 pb-6 px-2 sm:px-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-lg text-sky-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Emerge Community Gatherings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-700 font-bold tracking-tight">
              Club Events
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">
              Explore poetic milestones, open mics, mushairas, and literary gatherings hosted by Emerge Literature Club, YCCE.
            </p>
          </div>

          {/* Top-Right Calendar Trigger */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setShowCalendar(true);
                setSelectedDateEvents(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-zinc-700 shadow-xs transition-all active:scale-98 cursor-pointer group"
              title="Open Events Calendar"
              aria-label="Open Events Calendar"
            >
              <CalendarIcon className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
              <span>Events Calendar</span>
              {eventsWithDatesCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 rounded-full">
                  {eventsWithDatesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Compact Calendar Modal / Popover */}
        {showCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-5 shadow-xl text-left relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800">
                      Events Calendar
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Tap highlighted dates to jump to events
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close Calendar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 text-gray-500 hover:text-zinc-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold text-zinc-700">
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </span>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 text-gray-500 hover:text-zinc-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="text-[11px] font-semibold text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Blank days before the 1st */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNumber = i + 1;
                  const dateKey = `${calendarYear}-${String(
                    calendarMonth + 1
                  ).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

                  const matchingEvents = eventsByDate.get(dateKey) || [];
                  const hasEvent = matchingEvents.length > 0;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={!hasEvent}
                      onClick={() => {
                        if (matchingEvents.length === 1) {
                          handleScrollToEvent(matchingEvents[0].id);
                        } else if (matchingEvents.length > 1) {
                          setSelectedDateEvents({
                            date: dateKey,
                            items: matchingEvents,
                          });
                        }
                      }}
                      className={`h-9 rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center justify-center ${
                        hasEvent
                          ? "bg-sky-500 text-white font-bold shadow-xs hover:bg-sky-600 active:scale-95 cursor-pointer ring-2 ring-sky-200"
                          : "text-zinc-600 hover:bg-gray-50 cursor-default"
                      }`}
                      title={
                        hasEvent
                          ? `${matchingEvents.length} event(s): ${matchingEvents
                              .map((e) => e.title)
                              .join(", ")}`
                          : undefined
                      }
                    >
                      <span>{dayNumber}</span>
                      {hasEvent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Multi-event selector when multiple events share a single date */}
              {selectedDateEvents && (
                <div className="mt-4 pt-3 border-t border-gray-100 animate-in fade-in duration-150">
                  <p className="text-[11px] font-semibold text-zinc-600 mb-2">
                    Events on {formatDisplayDate(selectedDateEvents.date)}:
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedDateEvents.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleScrollToEvent(item.id)}
                        className="w-full p-2 bg-sky-50 hover:bg-sky-100 rounded-lg text-left text-xs font-semibold text-sky-800 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar Footer / Legend */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  <span>Scheduled Club Event</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Feed Grid */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">
                Loading club events...
              </p>
            </div>
          ) : error ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 mb-1">
                Unable to load events
              </h3>
              <p className="text-xs text-red-600 font-medium mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchEvents}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 px-6 text-center max-w-md mx-auto bg-white border-2 border-gray-200 rounded-2xl flex flex-col items-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-700">
                No Events Scheduled Yet
              </h3>
              <p className="text-xs text-gray-400 mt-1 mb-5 leading-relaxed">
                Stay tuned! New open mics, poetry slams, and literary workshops will be announced here soon.
              </p>
              <Link
                href="/shers"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
              >
                <Layers className="w-4 h-4" />
                <span>Explore Shayari Feed</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-6">
              {events.map((val) => {
                const isHighlighted = highlightedEventId === val.id;
                const hasValidUrl = isValidHttpUrl(val.registration_url);

                return (
                  <div
                    id={`event-${val.id}`}
                    key={val.id}
                    className={`h-[36rem] border-2 p-4 rounded-2xl flex flex-col bg-white transition-all duration-500 ${
                      isHighlighted
                        ? "border-sky-500 ring-4 ring-sky-200 shadow-xl scale-[1.01]"
                        : "border-gray-200 hover:border-gray-300 shadow-xs"
                    }`}
                  >
                    {/* Poster */}
                    <div className="h-60 sm:h-72 md:h-80 w-full overflow-hidden rounded-2xl bg-gray-100 flex-shrink-0 relative">
                      <Image
                        src={val.image_url || "/image/logo.png"}
                        alt={val.title}
                        width={800}
                        height={600}
                        unoptimized={val.image_url?.startsWith("http") ? true : false}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Date Badge */}
                    <div className="mt-3 flex items-center gap-1.5">
                      {val.event_date ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold">
                          <CalendarIcon className="w-3.5 h-3.5 text-sky-500" />
                          <span>{formatDisplayDate(val.event_date)}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Date to be announced</span>
                        </div>
                      )}
                    </div>

                    {/* Event Title */}
                    <h2 className="mt-2 text-lg sm:text-xl font-bold text-zinc-700 line-clamp-1">
                      {val.title}
                    </h2>

                    {/* Event Description */}
                    <p className="mt-1.5 text-sm leading-5 text-zinc-500 overflow-y-auto flex-1 pr-1">
                      {val.description}
                    </p>

                    {/* Registration Section */}
                    {val.registration_enabled && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {hasValidUrl && val.registration_url ? (
                          <a
                            href={val.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <span>Register Now</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-xl cursor-not-allowed"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Registration link unavailable</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
