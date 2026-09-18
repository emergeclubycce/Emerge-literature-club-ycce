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

        {/* Google Calendar-Style Modal / Full View */}
        {showCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              
              {/* Google Calendar Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 gap-3 bg-white">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
                      <CalendarDays className="w-5 h-5 text-sky-500" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-800 tracking-tight">
                      {MONTH_NAMES[calendarMonth]} <span className="font-normal text-zinc-500">{calendarYear}</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 sm:ml-2">
                    {/* Today Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setCurrentCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
                        setSelectedDateEvents(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-gray-100 active:bg-gray-200 border border-gray-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Today
                    </button>

                    {/* Prev / Next Arrows */}
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        title="Previous Month"
                        aria-label="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                        title="Next Month"
                        aria-label="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right controls: Legend & Close */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    <span>Scheduled Event</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCalendar(false);
                      setSelectedDateEvents(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-zinc-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ml-auto sm:ml-0"
                    aria-label="Close Calendar"
                    title="Close Calendar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid Container */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50/50">
                {/* Day of Week Header */}
                <div className="grid grid-cols-7 border border-gray-200 bg-white rounded-t-xl overflow-hidden text-center divide-x divide-gray-200">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <div
                      key={day}
                      className={`py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider ${
                        idx === 0 || idx === 6 ? "text-gray-400 bg-gray-50/40" : "text-zinc-600"
                      }`}
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.slice(0, 1)}</span>
                    </div>
                  ))}
                </div>

                {/* Days Month Grid (Google Calendar style rows & cells) */}
                <div className="grid grid-cols-7 border-x border-b border-gray-200 bg-white rounded-b-xl overflow-hidden divide-x divide-y divide-gray-200">
                  {/* Prev Month trailing days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                    const prevMonthLastDate = new Date(calendarYear, calendarMonth, 0).getDate();
                    const dayNum = prevMonthLastDate - firstDayOfWeek + i + 1;
                    return (
                      <div
                        key={`prev-${i}`}
                        className="min-h-[4.5rem] sm:min-h-[6.5rem] p-1.5 sm:p-2 bg-gray-50/70 text-gray-300 flex flex-col justify-between select-none"
                      >
                        <span className="text-xs font-medium text-gray-300">{dayNum}</span>
                      </div>
                    );
                  })}

                  {/* Current Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

                    const today = new Date();
                    const isCurrentToday =
                      today.getFullYear() === calendarYear &&
                      today.getMonth() === calendarMonth &&
                      today.getDate() === dayNumber;

                    const matchingEvents = eventsByDate.get(dateKey) || [];
                    const hasEvents = matchingEvents.length > 0;

                    return (
                      <div
                        key={dateKey}
                        onClick={() => {
                          if (matchingEvents.length === 1) {
                            handleScrollToEvent(matchingEvents[0].id);
                          } else if (matchingEvents.length > 1) {
                            setSelectedDateEvents({ date: dateKey, items: matchingEvents });
                          }
                        }}
                        className={`min-h-[4.5rem] sm:min-h-[6.5rem] p-1 sm:p-1.5 flex flex-col transition-colors group relative ${
                          hasEvents ? "cursor-pointer hover:bg-sky-50/40" : "hover:bg-gray-50/50"
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                              isCurrentToday
                                ? "bg-blue-600 text-white font-bold shadow-xs"
                                : hasEvents
                                ? "text-zinc-900 group-hover:text-sky-600 font-bold"
                                : "text-zinc-700"
                            }`}
                          >
                            {dayNumber}
                          </span>

                          {hasEvents && (
                            <span className="text-[10px] font-bold text-sky-600 sm:hidden">
                              •
                            </span>
                          )}
                        </div>

                        {/* Event Chips (Google Calendar Style) */}
                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                          {matchingEvents.slice(0, 2).map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScrollToEvent(ev.id);
                              }}
                              title={ev.title}
                              className="w-full text-left px-1.5 py-0.5 sm:py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-[10px] sm:text-[11px] font-medium leading-tight truncate shadow-2xs transition-transform active:scale-98 cursor-pointer flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 hidden sm:inline-block" />
                              <span className="truncate">{ev.title}</span>
                            </button>
                          ))}

                          {matchingEvents.length > 2 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDateEvents({ date: dateKey, items: matchingEvents });
                              }}
                              className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 text-left px-1 py-0.5 rounded hover:bg-sky-50 transition-colors"
                            >
                              +{matchingEvents.length - 2} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Next Month leading empty days to complete the grid */}
                  {(() => {
                    const totalCells = firstDayOfWeek + daysInMonth;
                    const remainder = totalCells % 7;
                    const nextDays = remainder === 0 ? 0 : 7 - remainder;
                    return Array.from({ length: nextDays }).map((_, i) => (
                      <div
                        key={`next-${i}`}
                        className="min-h-[4.5rem] sm:min-h-[6.5rem] p-1.5 sm:p-2 bg-gray-50/70 text-gray-300 flex flex-col justify-between select-none"
                      >
                        <span className="text-xs font-medium text-gray-300">{i + 1}</span>
                      </div>
                    ));
                  })()}
                </div>

                {/* Selected Date Multi-Event Drawer / Popover */}
                {selectedDateEvents && (
                  <div className="mt-3 p-3.5 bg-white border border-sky-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-bold text-zinc-800">
                          Events on {formatDisplayDate(selectedDateEvents.date)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDateEvents(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {selectedDateEvents.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleScrollToEvent(item.id)}
                          className="p-2.5 bg-sky-50/70 hover:bg-sky-100/80 border border-sky-100 rounded-lg text-left transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-zinc-800 truncate group-hover:text-sky-700">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Bar */}
              <div className="px-4 sm:px-6 py-2.5 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500">
                <span className="text-[11px] sm:text-xs">
                  Click any event chip to jump directly to its details and registration.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCalendar(false);
                    setSelectedDateEvents(null);
                  }}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Done
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
                    className={`h-[38rem] border-2 p-4 rounded-2xl flex flex-col justify-between bg-white transition-all duration-500 group ${
                      isHighlighted
                        ? "border-sky-500 ring-4 ring-sky-200 shadow-xl scale-[1.01]"
                        : "border-gray-200 hover:border-sky-200 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex flex-col flex-1 overflow-hidden">
                      {/* Poster (Clickable to dynamic route) */}
                      <Link
                        href={`/event/${val.id}`}
                        className="h-60 sm:h-64 md:h-72 w-full overflow-hidden rounded-2xl bg-gray-100 flex-shrink-0 relative block cursor-pointer"
                      >
                        <Image
                          src={val.image_url || "/image/logo.png"}
                          alt={val.title}
                          width={800}
                          height={600}
                          unoptimized={val.image_url?.startsWith("http") ? true : false}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-xs font-semibold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                            Click to view full event
                          </span>
                        </div>
                      </Link>

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

                      {/* Event Title (Clickable) */}
                      <Link href={`/event/${val.id}`}>
                        <h2 className="mt-2 text-lg sm:text-xl font-bold text-zinc-800 hover:text-sky-600 transition-colors line-clamp-1 cursor-pointer">
                          {val.title}
                        </h2>
                      </Link>

                      {/* Event Description */}
                      <p className="mt-1.5 text-sm leading-5 text-zinc-500 line-clamp-3 pr-1">
                        {val.description}
                      </p>
                    </div>

                    {/* Actions / Routing Section */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                      <Link
                        href={`/event/${val.id}`}
                        className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-sky-50 text-zinc-700 hover:text-sky-700 text-xs font-semibold transition-all border border-gray-200/80 hover:border-sky-200 cursor-pointer"
                      >
                        <span>View Event Details</span>
                        <ChevronRight className="w-4 h-4 text-sky-500 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      {val.registration_enabled && (
                        <div>
                          {hasValidUrl && val.registration_url ? (
                            <a
                              href={val.registration_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <span>Register Now</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-400 text-xs font-medium rounded-xl cursor-not-allowed"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Registration link unavailable</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
