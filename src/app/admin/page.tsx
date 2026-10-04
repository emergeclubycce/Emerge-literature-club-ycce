"use client";

import { logger } from "@/utils/logger";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import supabase from "@/config/supabase";
import {
  Shield,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  User,
  ArrowLeft,
  Calendar,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Upload,
  AlertTriangle,
  Camera,
  Medal,
  Trophy,
  ClipboardList,
  Activity,
  Filter,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import { getAvatarFromUser } from "@/utils/profile";
import { renderFormattedText } from "@/utils/posts";
import {
  validateImageFile,
  optimizeImage,
  formatFileSize,
} from "@/utils/imageOptimizer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface PostItem {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  authorName: string;
  authorPhoto: string | null;
  author_email?: string | null;
}

interface AdminEvent {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  event_date: string | null;
  registration_enabled: boolean;
  registration_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminMemory {
  id: number;
  title: string;
  description: string;
  event_date: string | null;
  type: "event" | "competition";
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  photos_count?: number;
}

interface AdminPhoto {
  id: number;
  memory_id: number;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface AdminWinner {
  id: number;
  memory_id: number;
  name: string;
  position: string | null;
  image_url: string | null;
  description: string | null;
}

interface ActivityLog {
  id: number;
  action: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: number | null;
  user_id: string | null;
  user_email: string | null;
  description: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Section switcher: Shayari Moderation vs Events Management vs Memories Management vs Activity Log
  const [mainSection, setMainSection] = useState<"shayari" | "events" | "memories" | "logs">("shayari");

  // ----------------- 4. ACTIVITY LOG STATE -----------------
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsFilter, setLogsFilter] = useState<"all" | "posts" | "events" | "memories" | "admins">("all");

  // Feedback banner
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ----------------- 1. SHAYARI STATE -----------------
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  // Pagination + search for posts
  const PAGE_SIZE = 20;
  const [postsPage, setPostsPage] = useState(0);
  const [postsTotalCount, setPostsTotalCount] = useState(0);
  const [postsSearchInput, setPostsSearchInput] = useState("");
  const [postsSearch, setPostsSearch] = useState("");

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  // ----------------- 2. EVENTS STATE ------------------
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsPage, setEventsPage] = useState(0);
  const [eventsTotalCount, setEventsTotalCount] = useState(0);
  const [eventsSearchInput, setEventsSearchInput] = useState("");
  const [eventsSearch, setEventsSearch] = useState("");
  const [refetchEventsKey, setRefetchEventsKey] = useState(0);

  // Event Add / Edit Modal state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventRegEnabled, setEventRegEnabled] = useState(false);
  const [eventRegUrl, setEventRegUrl] = useState("");
  const [eventPosterFile, setEventPosterFile] = useState<File | null>(null);
  const [eventPosterPreview, setEventPosterPreview] = useState<string | null>(null);
  const [eventPosterOptimizing, setEventPosterOptimizing] = useState(false);
  const [eventPosterOptimizingStatus, setEventPosterOptimizingStatus] = useState<string | null>(null);
  const [eventPosterStats, setEventPosterStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
  } | null>(null);
  const [eventFormSaving, setEventFormSaving] = useState(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  // Delete event confirmation modal state
  const [deletingEvent, setDeletingEvent] = useState<AdminEvent | null>(null);
  const [deleteEventLoading, setDeleteEventLoading] = useState(false);
  const [deleteEventError, setDeleteEventError] = useState<string | null>(null);

  // ----------------- 3. MEMORIES STATE -----------------
  const [adminMemories, setAdminMemories] = useState<AdminMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [memoriesPage, setMemoriesPage] = useState(0);
  const [memoriesTotalCount, setMemoriesTotalCount] = useState(0);
  const [memoriesSearchInput, setMemoriesSearchInput] = useState("");
  const [memoriesSearch, setMemoriesSearch] = useState("");
  const [refetchMemoriesKey, setRefetchMemoriesKey] = useState(0);

  // Memory Add / Edit Modal state
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AdminMemory | null>(null);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryDescription, setMemoryDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [memoryType, setMemoryType] = useState<"event" | "competition">("event");
  const [memoryCoverFile, setMemoryCoverFile] = useState<File | null>(null);
  const [memoryCoverPreview, setMemoryCoverPreview] = useState<string | null>(null);
  const [memoryCoverOptimizing, setMemoryCoverOptimizing] = useState(false);
  const [memoryCoverOptimizingStatus, setMemoryCoverOptimizingStatus] = useState<string | null>(null);
  const [memoryCoverStats, setMemoryCoverStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
  } | null>(null);
  const [memoryFormSaving, setMemoryFormSaving] = useState(false);
  const [memoryFormError, setMemoryFormError] = useState<string | null>(null);

  // Photos & winners within memory modal
  const [memoryPhotos, setMemoryPhotos] = useState<AdminPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [memoryWinners, setMemoryWinners] = useState<AdminWinner[]>([]);

  // Winner sub-form state
  const [newWinnerName, setNewWinnerName] = useState("");
  const [newWinnerPos, setNewWinnerPos] = useState("");
  const [newWinnerDesc, setNewWinnerDesc] = useState("");
  const [newWinnerFile, setNewWinnerFile] = useState<File | null>(null);
  const [newWinnerPreview, setNewWinnerPreview] = useState<string | null>(null);
  const [newWinnerOptimizing, setNewWinnerOptimizing] = useState(false);
  const [newWinnerStats, setNewWinnerStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
  } | null>(null);
  const [addingWinner, setAddingWinner] = useState(false);

  // Delete memory confirmation modal state
  const [deletingMemory, setDeletingMemory] = useState<AdminMemory | null>(null);
  const [deleteMemoryLoading, setDeleteMemoryLoading] = useState(false);
  const [deleteMemoryError, setDeleteMemoryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const memoryCoverInputRef = useRef<HTMLInputElement>(null);

  // 1. Check Authentication and Admin Status
  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData?.user) {
          if (authError?.message?.toLowerCase().includes("refresh token")) {
            await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          }
          if (isMounted) router.push("/auth/login");
          return;
        }

        const currentUser = authData.user;
        if (!isMounted) return;
        setUser(currentUser);

        // Verify against public.admins
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (adminError || !adminData) {
          if (isMounted) {
            setIsAdmin(false);
            setAuthChecking(false);
          }
          return;
        }

        if (isMounted) {
          setIsAdmin(true);
          setAuthChecking(false);
        }
      } catch (err) {
        logger.error("Admin check failed:", err);
        if (isMounted) {
          setIsAdmin(false);
          setAuthChecking(false);
        }
      }
    }

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Fetch posts whenever activeTab / postsPage / postsSearch changes
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    async function fetchPostsForModeration() {
      try {
        setLoadingPosts(true);

        const from = postsPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("posts")
          .select("*", { count: "exact" })
          .eq("status", activeTab)
          .order("created_at", { ascending: activeTab === "pending" })
          .range(from, to);

        if (postsSearch.trim()) {
          query = query.ilike("content", `%${postsSearch.trim()}%`);
        }

        const { data: postsData, error: postsError, count } = await query;

        if (postsError) throw postsError;

        if (isMounted) setPostsTotalCount(count ?? 0);

        // Fetch corresponding author profiles
        const userIds = [
          ...new Set((postsData || []).map((p) => p.user_id).filter(Boolean)),
        ];

        let profilesMap: Record<string, { name?: string; photo_url?: string }> = {};

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, name, photo_url")
            .in("user_id", userIds);

          if (profilesData) {
            profilesData.forEach((pr) => {
              profilesMap[pr.user_id] = pr;
            });
          }
        }

        if (isMounted) {
          const formatted: PostItem[] = (postsData || []).map((p) => {
            const authorProfile = p.user_id ? profilesMap[p.user_id] : null;
            const displayAuthor = authorProfile?.name?.trim() || "Anonymous";
            const authorPhoto =
              authorProfile?.photo_url?.trim() ||
              (p.user_id && p.user_id === user?.id ? getAvatarFromUser(user) : null) ||
              null;
            return {
              id: p.id,
              user_id: p.user_id,
              content: p.content,
              image_url: p.image_url,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              authorName: displayAuthor,
              authorPhoto: authorPhoto,
              author_email: (p as any).author_email || null,
            };
          });
          setPosts(formatted);
        }
      } catch (err: any) {
        logger.error("Error fetching posts for moderation:", err);
        if (isMounted) {
          setFeedbackMessage({
            type: "error",
            text: err.message || "Failed to load moderation posts. Please try again.",
          });
        }
      } finally {
        if (isMounted) setLoadingPosts(false);
      }
    }

    fetchPostsForModeration();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, activeTab, postsPage, postsSearch]);

  // 3. Fetch events — server-side pagination + search
  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;

    async function fetchEvents() {
      try {
        setLoadingEvents(true);
        const from = eventsPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("events")
          .select("*", { count: "exact" })
          .order("id", { ascending: true })
          .range(from, to);

        if (eventsSearch.trim()) {
          query = query.ilike("title", `%${eventsSearch.trim()}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        if (isMounted) {
          setAdminEvents(data || []);
          setEventsTotalCount(count ?? 0);
        }
      } catch (err: any) {
        logger.error("Failed to load admin events:", err);
        if (isMounted)
          setFeedbackMessage({ type: "error", text: err.message || "Failed to load events." });
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    }

    fetchEvents();
    return () => { isMounted = false; };
  }, [isAdmin, eventsPage, eventsSearch, refetchEventsKey]);

  // 4. Fetch memories — server-side pagination + search
  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;

    async function fetchMemories() {
      try {
        setLoadingMemories(true);
        const from = memoriesPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("memories")
          .select("*, memory_photos(id)", { count: "exact" })
          .order("id", { ascending: false })
          .range(from, to);

        if (memoriesSearch.trim()) {
          query = query.ilike("title", `%${memoriesSearch.trim()}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        if (isMounted) {
          const formatted: AdminMemory[] = (data || []).map((row: any) => ({
            ...row,
            photos_count: Array.isArray(row.memory_photos) ? row.memory_photos.length : 0,
          }));
          setAdminMemories(formatted);
          setMemoriesTotalCount(count ?? 0);
        }
      } catch (err: any) {
        logger.error("Failed to load admin memories:", err);
        if (isMounted)
          setFeedbackMessage({ type: "error", text: err.message || "Failed to load memories." });
      } finally {
        if (isMounted) setLoadingMemories(false);
      }
    }

    fetchMemories();
    return () => { isMounted = false; };
  }, [isAdmin, memoriesPage, memoriesSearch, refetchMemoriesKey]);


  // ----------------- ACTIVITY LOG FETCH -----------------
  const fetchActivityLogs = async (filter: "all" | "posts" | "events" | "memories" | "admins" = "all") => {
    if (!isAdmin) return;
    try {
      setLoadingLogs(true);
      // Try 'activity_logs' (plural) first, then fallback to 'activity_log' (singular)
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (filter !== "all") {
        query = query.eq("table_name", filter);
      }

      let res = await query;

      if (res.error) {
        // Fallback to singular 'activity_log'
        let fallbackQuery = supabase
          .from("activity_log")
          .select("*")
          .order("id", { ascending: false })
          .limit(200);

        if (filter !== "all") {
          fallbackQuery = fallbackQuery.eq("table_name", filter);
        }

        res = await fallbackQuery;
      }

      if (res.error) {
        logger.error("Failed to load activity logs:", res.error);
        setActivityLogs([]);
        return;
      }

      const formatted: ActivityLog[] = (res.data || []).map((row: any) => ({
        id: row.id,
        action: row.action || "INSERT",
        table_name: row.table_name || "unknown",
        record_id: row.record_id ?? null,
        user_id: row.user_id ?? null,
        user_email: row.user_email ?? null,
        description: row.description || `${row.action || "Action"} on ${row.table_name || "table"} #${row.record_id ?? ""}`,
        old_data: row.old_data || null,
        new_data: row.new_data || null,
        created_at: row.created_at || row.changed_at || new Date().toISOString(),
      }));

      setActivityLogs(formatted);
    } catch (err: any) {
      logger.error("Failed to load activity logs:", err);
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // ----------------- SHAYARI ACTIONS -----------------
  const handleApprove = async (postId: number) => {
    try {
      setActionLoadingId(postId);
      setFeedbackMessage(null);

      const { error } = await supabase
        .from("posts")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;

      // Find the approved post's author email before removing from list
      const approvedPost = posts.find((p) => p.id === postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFeedbackMessage({
        type: "success",
        text: `Post #${postId} has been approved successfully!`,
      });

      // Send approval email to the author (non-blocking)
      if (approvedPost) {
        try {
          let authorEmail = approvedPost.author_email;

          // If not stored directly on post, check profiles table
          if (!authorEmail && approvedPost.user_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", approvedPost.user_id)
              .maybeSingle();
            authorEmail = (profileData as any)?.email ?? null;
          }

          if (authorEmail) {
            fetch("/api/email/approval", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: authorEmail,
                name: approvedPost.authorName,
                preview: approvedPost.content,
                postId: approvedPost.id,
              }),
            }).catch(() => {});
          }
        } catch {
          // email errors are non-fatal
        }
      }
    } catch (err: any) {
      logger.error("Approve error:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to approve post. Please try again.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (postId: number) => {
    try {
      setActionLoadingId(postId);
      setFeedbackMessage(null);

      const { error } = await supabase
        .from("posts")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFeedbackMessage({
        type: "success",
        text: `Post #${postId} has been rejected.`,
      });
    } catch (err: any) {
      logger.error("Reject error:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to reject post. Please try again.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ----------------- EVENT MODAL HELPERS -----------------
  const openAddEventModal = () => {
    if (eventPosterPreview && eventPosterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(eventPosterPreview);
    }
    setEditingEvent(null);
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventRegEnabled(false);
    setEventRegUrl("");
    setEventPosterFile(null);
    setEventPosterPreview(null);
    setEventPosterOptimizing(false);
    setEventPosterOptimizingStatus(null);
    setEventPosterStats(null);
    setEventFormError(null);
    setEventModalOpen(true);
  };

  const openEditEventModal = (event: AdminEvent) => {
    if (eventPosterPreview && eventPosterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(eventPosterPreview);
    }
    setEditingEvent(event);
    setEventTitle(event.title || "");
    setEventDescription(event.description || "");
    setEventDate(event.event_date || "");
    setEventRegEnabled(Boolean(event.registration_enabled));
    setEventRegUrl(event.registration_url || "");
    setEventPosterFile(null);
    setEventPosterPreview(event.image_url || null);
    setEventPosterOptimizing(false);
    setEventPosterOptimizingStatus(null);
    setEventPosterStats(null);
    setEventFormError(null);
    setEventModalOpen(true);
  };

  const handleEventFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. FRONTEND VALIDATION FIRST (3 MB limit)
    const validation = validateImageFile(file, "events");
    if (!validation.valid) {
      setEventFormError(validation.error || "Image is too large. Maximum allowed size is 3 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (eventPosterPreview && eventPosterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(eventPosterPreview);
    }
    setEventPosterFile(null);
    setEventPosterPreview(null);
    setEventPosterStats(null);
    setEventPosterOptimizing(true);
    setEventPosterOptimizingStatus("Optimizing poster image...");

    try {
      // 2. FRONTEND ADAPTIVE OPTIMIZATION
      const result = await optimizeImage(file, "events", {
        onStatusChange: (status) => setEventPosterOptimizingStatus(status),
      });

      setEventPosterFile(result.file);
      setEventPosterPreview(result.previewUrl);
      setEventPosterStats({
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savedPercentage: result.savedPercentage,
      });
      setEventPosterOptimizingStatus(`Image optimized — ${formatFileSize(result.optimizedSize)}`);
    } catch (err: any) {
      logger.error("Event poster optimization error:", err);
      setEventFormError(err.message || "Unable to optimize this image. Please try another image.");
      setEventPosterFile(null);
      setEventPosterPreview(null);
      setEventPosterStats(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setEventPosterOptimizing(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventFormError(null);

    const trimmedTitle = eventTitle.trim();
    const trimmedDesc = eventDescription.trim();

    if (!trimmedTitle) {
      setEventFormError("Event title is required.");
      return;
    }
    if (!trimmedDesc) {
      setEventFormError("Event description is required.");
      return;
    }

    if (!editingEvent && !eventDate) {
      setEventFormError("Event date is required for newly scheduled events.");
      return;
    }

    if (eventRegEnabled) {
      if (!eventRegUrl.trim()) {
        setEventFormError("Google Form / Registration URL is required when registration is enabled.");
        return;
      }
      try {
        const parsed = new URL(eventRegUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        setEventFormError("Please provide a valid registration URL (starting with http:// or https://).");
        return;
      }
    }

    if (eventPosterOptimizing) {
      setEventFormError("Please wait until the poster image optimization completes.");
      return;
    }

    try {
      setEventFormSaving(true);
      let finalImageUrl = editingEvent ? editingEvent.image_url : "/image/logo.png";

      if (eventPosterFile && user) {
        // Final size validation safeguard
        if (eventPosterFile.size > 3 * 1024 * 1024) {
          throw new Error("Image is too large. Maximum allowed size is 3 MB.");
        }

        const cleanName = eventPosterFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${user.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(filePath, eventPosterFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: eventPosterFile.type || "image/webp",
          });

        if (uploadError) {
          throw new Error(`Poster upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("event-images")
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      if (editingEvent) {
        const { error: updateError } = await supabase
          .from("events")
          .update({
            title: trimmedTitle,
            description: trimmedDesc,
            image_url: finalImageUrl,
            event_date: eventDate ? eventDate : null,
            registration_enabled: eventRegEnabled,
            registration_url: eventRegEnabled ? eventRegUrl.trim() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEvent.id);

        if (updateError) throw updateError;

        setFeedbackMessage({
          type: "success",
          text: `Event "${trimmedTitle}" was updated successfully!`,
        });
      } else {
        const { error: insertError } = await supabase.from("events").insert({
          title: trimmedTitle,
          description: trimmedDesc,
          image_url: finalImageUrl,
          event_date: eventDate ? eventDate : null,
          registration_enabled: eventRegEnabled,
          registration_url: eventRegEnabled ? eventRegUrl.trim() : null,
        });

        if (insertError) throw insertError;

        setFeedbackMessage({
          type: "success",
          text: `Event "${trimmedTitle}" has been added to the directory!`,
        });
      }

      setEventModalOpen(false);
      setEditingEvent(null);
      setRefetchEventsKey((k) => k + 1);
    } catch (err: any) {
      logger.error("Save event error:", err);
      setEventFormError(err.message || "Failed to save event. Please check inputs.");
    } finally {
      setEventFormSaving(false);
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!deletingEvent) return;

    try {
      setDeleteEventLoading(true);
      setDeleteEventError(null);

      const { error: delError } = await supabase
        .from("events")
        .delete()
        .eq("id", deletingEvent.id);

      if (delError) throw delError;

      if (
        deletingEvent.image_url &&
        deletingEvent.image_url.includes("/event-images/") &&
        !deletingEvent.image_url.startsWith("/image/")
      ) {
        try {
          const parts = deletingEvent.image_url.split("/event-images/");
          if (parts[1]) {
            const rawPath = decodeURIComponent(parts[1]);
            await supabase.storage.from("event-images").remove([rawPath]);
          }
        } catch (cleanupErr) {
          logger.warn("Storage cleanup notice:", cleanupErr);
        }
      }

      setFeedbackMessage({
        type: "success",
        text: `Event "${deletingEvent.title}" was deleted permanently.`,
      });

      setDeletingEvent(null);
      setRefetchEventsKey((k) => k + 1);
    } catch (err: any) {
      logger.error("Delete event error:", err);
      setDeleteEventError(err.message || "Failed to delete event. Please try again.");
    } finally {
      setDeleteEventLoading(false);
    }
  };

  // ----------------- MEMORY MODAL HELPERS -----------------
  const openAddMemoryModal = () => {
    if (memoryCoverPreview && memoryCoverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(memoryCoverPreview);
    }
    if (newWinnerPreview) {
      URL.revokeObjectURL(newWinnerPreview);
    }
    setEditingMemory(null);
    setMemoryTitle("");
    setMemoryDescription("");
    setMemoryDate("");
    setMemoryType("event");
    setMemoryCoverFile(null);
    setMemoryCoverPreview(null);
    setMemoryCoverOptimizing(false);
    setMemoryCoverOptimizingStatus(null);
    setMemoryCoverStats(null);
    setMemoryPhotos([]);
    setMemoryWinners([]);
    setNewWinnerFile(null);
    setNewWinnerPreview(null);
    setNewWinnerOptimizing(false);
    setNewWinnerStats(null);
    setMemoryFormError(null);
    setMemoryModalOpen(true);
  };

  const openEditMemoryModal = async (mem: AdminMemory) => {
    if (memoryCoverPreview && memoryCoverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(memoryCoverPreview);
    }
    if (newWinnerPreview) {
      URL.revokeObjectURL(newWinnerPreview);
    }
    setEditingMemory(mem);
    setMemoryTitle(mem.title || "");
    setMemoryDescription(mem.description || "");
    setMemoryDate(mem.event_date || "");
    setMemoryType(mem.type || "event");
    setMemoryCoverFile(null);
    setMemoryCoverPreview(mem.cover_image_url || null);
    setMemoryCoverOptimizing(false);
    setMemoryCoverOptimizingStatus(null);
    setMemoryCoverStats(null);
    setNewWinnerFile(null);
    setNewWinnerPreview(null);
    setNewWinnerOptimizing(false);
    setNewWinnerStats(null);
    setMemoryFormError(null);
    setMemoryModalOpen(true);

    // Fetch photos for this memory
    try {
      const { data: pData } = await supabase
        .from("memory_photos")
        .select("*")
        .eq("memory_id", mem.id)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      setMemoryPhotos(pData || []);

      if (mem.type === "competition") {
        const { data: wData } = await supabase
          .from("memory_winners")
          .select("*")
          .eq("memory_id", mem.id)
          .order("id", { ascending: true });

        setMemoryWinners(wData || []);
      } else {
        setMemoryWinners([]);
      }
    } catch (fetchErr) {
      logger.error("Failed to load memory photos/winners:", fetchErr);
    }
  };

  const handleMemoryCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemoryFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. FRONTEND VALIDATION FIRST (3 MB limit)
    const validation = validateImageFile(file, "memories");
    if (!validation.valid) {
      setMemoryFormError(validation.error || "Image is too large. Maximum allowed size is 3 MB.");
      if (memoryCoverInputRef.current) memoryCoverInputRef.current.value = "";
      return;
    }

    if (memoryCoverPreview && memoryCoverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(memoryCoverPreview);
    }
    setMemoryCoverFile(null);
    setMemoryCoverPreview(null);
    setMemoryCoverStats(null);
    setMemoryCoverOptimizing(true);
    setMemoryCoverOptimizingStatus("Optimizing cover image...");

    try {
      // 2. FRONTEND ADAPTIVE OPTIMIZATION
      const result = await optimizeImage(file, "memories", {
        onStatusChange: (status) => setMemoryCoverOptimizingStatus(status),
      });

      setMemoryCoverFile(result.file);
      setMemoryCoverPreview(result.previewUrl);
      setMemoryCoverStats({
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savedPercentage: result.savedPercentage,
      });
      setMemoryCoverOptimizingStatus(`Image optimized — ${formatFileSize(result.optimizedSize)}`);
    } catch (err: any) {
      logger.error("Memory cover optimization error:", err);
      setMemoryFormError(err.message || "Unable to optimize this image. Please try another image.");
      setMemoryCoverFile(null);
      setMemoryCoverPreview(null);
      setMemoryCoverStats(null);
      if (memoryCoverInputRef.current) memoryCoverInputRef.current.value = "";
    } finally {
      setMemoryCoverOptimizing(false);
    }
  };

  // Upload Multiple Photos to Memory
  const handleUploadGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    if (!editingMemory) {
      setMemoryFormError("Please save the memory first before uploading gallery photos.");
      return;
    }

    const files = Array.from(e.target.files);

    // 1. FRONTEND VALIDATION FIRST (Every image must be <= 3 MB)
    for (const f of files) {
      const val = validateImageFile(f, "memories");
      if (!val.valid) {
        setMemoryFormError(val.error || "Image is too large. Maximum allowed size is 3 MB.");
        e.target.value = "";
        return;
      }
    }

    try {
      setUploadingPhotos(true);
      setMemoryFormError(null);

      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        // 2. FRONTEND ADAPTIVE OPTIMIZATION
        const optResult = await optimizeImage(f, "memories");
        const optimizedFile = optResult.file;

        // Final size safeguard
        if (optimizedFile.size > 3 * 1024 * 1024) {
          throw new Error("One or more images exceeded the 3 MB limit after optimization.");
        }

        const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${editingMemory.id}/${Date.now()}-${i}-${cleanName}`;

        const { error: upErr } = await supabase.storage
          .from("memory-images")
          .upload(filePath, optimizedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: optimizedFile.type || "image/webp",
          });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("memory-images")
          .getPublicUrl(filePath);

        // Insert into memory_photos
        const nextOrder = memoryPhotos.length + i + 1;
        const { error: insertPhotoErr } = await supabase
          .from("memory_photos")
          .insert({
            memory_id: editingMemory.id,
            image_url: urlData.publicUrl,
            display_order: nextOrder,
            caption: null,
          });

        if (insertPhotoErr) throw insertPhotoErr;
      }

      // Refetch photos
      const { data: pData } = await supabase
        .from("memory_photos")
        .select("*")
        .eq("memory_id", editingMemory.id)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      setMemoryPhotos(pData || []);
      setRefetchMemoriesKey((k) => k + 1);

    } catch (err: any) {
      logger.error("Gallery upload error:", err);
      setMemoryFormError(err.message || "Failed to upload one or more photos.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Delete individual photo
  const handleDeletePhoto = async (photoId: number, imageUrl: string) => {
    try {
      const { error: delErr } = await supabase
        .from("memory_photos")
        .delete()
        .eq("id", photoId);

      if (delErr) throw delErr;

      // Safely delete from memory-images storage if it's hosted there
      if (imageUrl.includes("/memory-images/") && !imageUrl.startsWith("/image/")) {
        try {
          const parts = imageUrl.split("/memory-images/");
          if (parts[1]) {
            const path = decodeURIComponent(parts[1]);
            await supabase.storage.from("memory-images").remove([path]);
          }
        } catch (sErr) {
          logger.warn("Storage delete notice:", sErr);
        }
      }

      setMemoryPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setRefetchMemoriesKey((k) => k + 1);

    } catch (err: any) {
      logger.error("Failed to delete photo:", err);
      setMemoryFormError(err.message || "Failed to delete photo.");
    }
  };

  // Add winner
  const handleWinnerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemoryFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, "memories");
    if (!validation.valid) {
      setMemoryFormError(validation.error || "Image is too large. Maximum allowed size is 3 MB.");
      e.target.value = "";
      return;
    }

    if (newWinnerPreview) {
      URL.revokeObjectURL(newWinnerPreview);
    }
    setNewWinnerFile(null);
    setNewWinnerPreview(null);
    setNewWinnerStats(null);
    setNewWinnerOptimizing(true);

    try {
      const result = await optimizeImage(file, "memories");
      setNewWinnerFile(result.file);
      setNewWinnerPreview(result.previewUrl);
      setNewWinnerStats({
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savedPercentage: result.savedPercentage,
      });
    } catch (err: any) {
      logger.error("Winner image optimization error:", err);
      setMemoryFormError(err.message || "Unable to optimize winner image.");
      setNewWinnerFile(null);
      setNewWinnerPreview(null);
      setNewWinnerStats(null);
      e.target.value = "";
    } finally {
      setNewWinnerOptimizing(false);
    }
  };

  const handleAddWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;
    if (newWinnerOptimizing) {
      setMemoryFormError("Please wait until winner image optimization completes.");
      return;
    }
    if (!newWinnerName.trim()) {
      setMemoryFormError("Winner name is required.");
      return;
    }

    try {
      setAddingWinner(true);
      setMemoryFormError(null);
      let winnerImageUrl: string | null = null;

      if (newWinnerFile && user) {
        if (newWinnerFile.size > 3 * 1024 * 1024) {
          throw new Error("Winner image is too large. Maximum allowed size is 3 MB.");
        }

        const cleanName = newWinnerFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${editingMemory.id}/winners/${Date.now()}-${cleanName}`;

        const { error: upErr } = await supabase.storage
          .from("memory-images")
          .upload(filePath, newWinnerFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: newWinnerFile.type || "image/webp",
          });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("memory-images")
          .getPublicUrl(filePath);

        winnerImageUrl = urlData.publicUrl;
      }

      const { data: insertedWinner, error: insertErr } = await supabase
        .from("memory_winners")
        .insert({
          memory_id: editingMemory.id,
          name: newWinnerName.trim(),
          position: newWinnerPos.trim() || null,
          description: newWinnerDesc.trim() || null,
          image_url: winnerImageUrl,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (insertedWinner) {
        setMemoryWinners((prev) => [...prev, insertedWinner]);
      }

      // Reset winner form
      setNewWinnerName("");
      setNewWinnerPos("");
      setNewWinnerDesc("");
      if (newWinnerPreview) {
        URL.revokeObjectURL(newWinnerPreview);
      }
      setNewWinnerFile(null);
      setNewWinnerPreview(null);
      setNewWinnerStats(null);
    } catch (err: any) {
      logger.error("Failed to add winner:", err);
      setMemoryFormError(err.message || "Failed to add winner.");
    } finally {
      setAddingWinner(false);
    }
  };

  // Delete winner
  const handleDeleteWinner = async (winnerId: number, imageUrl: string | null) => {
    try {
      const { error: delErr } = await supabase
        .from("memory_winners")
        .delete()
        .eq("id", winnerId);

      if (delErr) throw delErr;

      if (imageUrl && imageUrl.includes("/memory-images/") && !imageUrl.startsWith("/image/")) {
        try {
          const parts = imageUrl.split("/memory-images/");
          if (parts[1]) {
            const path = decodeURIComponent(parts[1]);
            await supabase.storage.from("memory-images").remove([path]);
          }
        } catch (sErr) {
          logger.warn("Storage winner delete notice:", sErr);
        }
      }

      setMemoryWinners((prev) => prev.filter((w) => w.id !== winnerId));
    } catch (err: any) {
      logger.error("Failed to delete winner:", err);
      setMemoryFormError(err.message || "Failed to remove winner.");
    }
  };

  // Save Memory
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemoryFormError(null);

    const trimmedTitle = memoryTitle.trim();
    const trimmedDesc = memoryDescription.trim();

    if (!trimmedTitle) {
      setMemoryFormError("Memory title is required.");
      return;
    }
    if (!trimmedDesc) {
      setMemoryFormError("Memory description is required.");
      return;
    }

    if (memoryCoverOptimizing) {
      setMemoryFormError("Please wait until the cover image optimization completes.");
      return;
    }

    try {
      setMemoryFormSaving(true);
      let finalCoverUrl = editingMemory ? editingMemory.cover_image_url : null;

      if (memoryCoverFile && user) {
        if (memoryCoverFile.size > 3 * 1024 * 1024) {
          throw new Error("Cover image is too large. Maximum allowed size is 3 MB.");
        }

        const cleanName = memoryCoverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `covers/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-images")
          .upload(filePath, memoryCoverFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: memoryCoverFile.type || "image/webp",
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("memory-images")
          .getPublicUrl(filePath);

        finalCoverUrl = urlData.publicUrl;
      }

      if (editingMemory) {
        const { error: updateError } = await supabase
          .from("memories")
          .update({
            title: trimmedTitle,
            description: trimmedDesc,
            event_date: memoryDate ? memoryDate : null,
            type: memoryType,
            cover_image_url: finalCoverUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMemory.id);

        if (updateError) throw updateError;

        setFeedbackMessage({
          type: "success",
          text: `Memory "${trimmedTitle}" was updated successfully!`,
        });
      } else {
        const { data: createdMem, error: insertError } = await supabase
          .from("memories")
          .insert({
            title: trimmedTitle,
            description: trimmedDesc,
            event_date: memoryDate ? memoryDate : null,
            type: memoryType,
            cover_image_url: finalCoverUrl,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setFeedbackMessage({
          type: "success",
          text: `Memory "${trimmedTitle}" has been published to the archive!`,
        });
      }

      setMemoryModalOpen(false);
      setEditingMemory(null);
      setRefetchMemoriesKey((k) => k + 1);

    } catch (err: any) {
      logger.error("Save memory error:", err);
      setMemoryFormError(err.message || "Failed to save memory.");
    } finally {
      setMemoryFormSaving(false);
    }
  };

  // Delete Memory
  const handleConfirmDeleteMemory = async () => {
    if (!deletingMemory) return;

    try {
      setDeleteMemoryLoading(true);
      setDeleteMemoryError(null);

      // 1. Fetch associated photos to clean up storage safely
      const { data: pData } = await supabase
        .from("memory_photos")
        .select("image_url")
        .eq("memory_id", deletingMemory.id);

      // 2. Delete row from public.memories (cascades to memory_photos & memory_winners)
      const { error: delError } = await supabase
        .from("memories")
        .delete()
        .eq("id", deletingMemory.id);

      if (delError) throw delError;

      // 3. Clean up uploaded storage objects (ignoring local assets)
      const urlsToClean = [
        deletingMemory.cover_image_url,
        ...(pData || []).map((p) => p.image_url),
      ].filter(Boolean) as string[];

      const storagePathsToRemove: string[] = [];
      urlsToClean.forEach((url) => {
        if (url.includes("/memory-images/") && !url.startsWith("/image/")) {
          const parts = url.split("/memory-images/");
          if (parts[1]) storagePathsToRemove.push(decodeURIComponent(parts[1]));
        }
      });

      if (storagePathsToRemove.length > 0) {
        try {
          await supabase.storage.from("memory-images").remove(storagePathsToRemove);
        } catch (cleanupErr) {
          logger.warn("Storage cleanup note:", cleanupErr);
        }
      }

      setFeedbackMessage({
        type: "success",
        text: `Memory "${deletingMemory.title}" was deleted permanently.`,
      });

      setDeletingMemory(null);
      setRefetchMemoriesKey((k) => k + 1);

    } catch (err: any) {
      logger.error("Delete memory error:", err);
      setDeleteMemoryError(err.message || "Failed to delete memory.");
    } finally {
      setDeleteMemoryLoading(false);
    }
  };

  // Auth checking screen
  if (authChecking) {
    return (
      <div
        className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            Checking administrator privileges...
          </p>
        </div>
      </div>
    );
  }

  // Access Denied Screen for Non-Admins
  if (!isAdmin) {
    return (
      <div
        className={`${inter.className} min-h-screen bg-gray-50 flex flex-col justify-between`}
      >
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
            You do not have administrative privileges to access the moderation dashboard.
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            Return to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className={`${inter.className} min-h-screen bg-gray-50 flex flex-col justify-between`}
    >
      <main className="w-full max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Management Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-800">
              {mainSection === "shayari"
                ? "Shayari Moderation Queue"
                : mainSection === "events"
                ? "Event Management Console"
                : mainSection === "memories"
                ? "Memories Management Console"
                : "Activity Log"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {mainSection === "shayari"
                ? "Review and moderate member submissions before they appear on the public feed."
                : mainSection === "events"
                ? "Add, edit, reschedule, or remove club events and configure registration links."
                : mainSection === "memories"
                ? "Publish visual memories, upload gallery photos, and showcase competition winners."
                : "A real-time audit trail of all actions — posts, events, admin changes, and deletions."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={
                mainSection === "shayari"
                  ? "/shers"
                  : mainSection === "events"
                  ? "/event"
                  : "/memories"
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors w-fit shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {mainSection === "shayari"
                  ? "View Shayari Feed"
                  : mainSection === "events"
                  ? "View Events Page"
                  : "View Memories Archive"}
              </span>
            </Link>
          </div>
        </div>

        {/* Top-Level Section Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-gray-200/70 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => {
              setMainSection("shayari");
              setFeedbackMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mainSection === "shayari"
                ? "bg-white text-zinc-800 shadow-xs"
                : "text-gray-500 hover:text-zinc-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Shayari Moderation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainSection("events");
              setFeedbackMessage(null);
              setRefetchEventsKey((k) => k + 1);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mainSection === "events"
                ? "bg-white text-zinc-800 shadow-xs"
                : "text-gray-500 hover:text-zinc-800"
            }`}
          >
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>Events Management</span>
            <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded-full">
              {adminEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainSection("memories");
              setFeedbackMessage(null);
              setRefetchMemoriesKey((k) => k + 1);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mainSection === "memories"
                ? "bg-white text-zinc-800 shadow-xs"
                : "text-gray-500 hover:text-zinc-800"
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-500" />
            <span>Memories Management</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
              {adminMemories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainSection("logs");
              setFeedbackMessage(null);
              fetchActivityLogs(logsFilter);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mainSection === "logs"
                ? "bg-white text-zinc-800 shadow-xs"
                : "text-gray-500 hover:text-zinc-800"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Activity Log</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in duration-150 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <p className="font-medium">{feedbackMessage.text}</p>
          </div>
        )}

        {/* ================= SECTION 1: SHAYARI MODERATION ================= */}
        {mainSection === "shayari" && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() => { setActiveTab("pending"); setPostsPage(0); setPostsSearch(""); setPostsSearchInput(""); }}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-gray-500 hover:text-zinc-800 hover:bg-gray-100"
                }`}
              >
                Pending Review {activeTab === "pending" && `(${postsTotalCount})`}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("approved"); setPostsPage(0); setPostsSearch(""); setPostsSearchInput(""); }}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-zinc-800 hover:bg-gray-100"
                }`}
              >
                Approved {activeTab === "approved" && `(${postsTotalCount})`}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("rejected"); setPostsPage(0); setPostsSearch(""); setPostsSearchInput(""); }}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === "rejected"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-zinc-800 hover:bg-gray-100"
                }`}
              >
                Rejected {activeTab === "rejected" && `(${postsTotalCount})`}
              </button>
            </div>

            {/* Search bar for Shayari */}
            <form
              onSubmit={(e) => { e.preventDefault(); setPostsPage(0); setPostsSearch(postsSearchInput); }}
              className="flex items-center gap-2 mb-5"
            >
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={postsSearchInput}
                  onChange={(e) => setPostsSearchInput(e.target.value)}
                  placeholder="Search by content…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                Search
              </button>
              {postsSearch && (
                <button
                  type="button"
                  onClick={() => { setPostsSearch(""); setPostsSearchInput(""); setPostsPage(0); }}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-zinc-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {loadingPosts ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                <p className="text-xs text-gray-400 font-medium">
                  Loading posts...
                </p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-20 px-6 text-center bg-white border border-gray-200 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-800">
                  No {activeTab} submissions
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {activeTab === "pending"
                    ? "All member submissions have been moderated. Check back later."
                    : `No posts are currently marked as ${activeTab}.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => {
                  const isActing = actionLoadingId === post.id;
                  const dateLabel = new Date(post.created_at).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  );

                  return (
                    <div
                      key={post.id}
                      className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col gap-4"
                    >
                      {/* 1. Author information */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            {post.authorPhoto ? (
                              <Image
                                src={post.authorPhoto}
                                alt={post.authorName}
                                width={40}
                                height={40}
                                unoptimized
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-800">
                              {post.authorName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{dateLabel}</span>
                              <span>•</span>
                              <span>ID: #{post.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Current Status Badge */}
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                            post.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : post.status === "rejected"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>

                      {/* 2. Post Text */}
                      <div className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed pl-1 flex-1">
                        {renderFormattedText(post.content)}
                      </div>

                      {/* 3. Post Image (Clickable Lightbox Thumbnail) */}
                      {post.image_url && (
                        <div className="w-fit">
                          <div
                            onClick={() => setLightboxImage(post.image_url)}
                            className="group relative w-44 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:ring-2 hover:ring-sky-400 transition-all flex items-center justify-center"
                            title="Click to view full image"
                          >
                            <Image
                              src={post.image_url}
                              alt="Shayari artwork thumbnail"
                              fill
                              sizes="176px"
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium backdrop-blur-2xs">
                              <ExternalLink className="w-4 h-4" />
                              <span>Enlarge Artwork</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Click image to enlarge
                          </p>
                        </div>
                      )}

                      {/* 4. Approve / Reject Controls */}
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                        {activeTab === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleReject(post.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleApprove(post.id)}
                              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Approve</span>
                            </button>
                          </>
                        )}
                        {activeTab === "approved" && (
                          <>
                            <button type="button" disabled className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-300 opacity-80 cursor-default select-none">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved</span>
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleReject(post.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {activeTab === "rejected" && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleApprove(post.id)}
                              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Approve</span>
                            </button>
                            <button type="button" disabled className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-300 opacity-80 cursor-default select-none">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Rejected</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Posts Pagination */}
            {postsTotalCount > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Showing {postsPage * PAGE_SIZE + 1}–{Math.min((postsPage + 1) * PAGE_SIZE, postsTotalCount)} of {postsTotalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={postsPage === 0}
                    onClick={() => setPostsPage((p) => p - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs font-semibold text-zinc-700 px-2">
                    Page {postsPage + 1} / {Math.ceil(postsTotalCount / PAGE_SIZE)}
                  </span>
                  <button
                    type="button"
                    disabled={(postsPage + 1) * PAGE_SIZE >= postsTotalCount}
                    onClick={() => setPostsPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= SECTION 2: EVENTS MANAGEMENT ================= */}
        {mainSection === "events" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-800">
                  Scheduled Events Directory
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                  {eventsTotalCount} Total
                </span>
              </div>

              <button
                type="button"
                onClick={openAddEventModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Event</span>
              </button>
            </div>

            {/* Search bar for Events */}
            <form
              onSubmit={(e) => { e.preventDefault(); setEventsPage(0); setEventsSearch(eventsSearchInput); }}
              className="flex items-center gap-2 mb-5"
            >
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={eventsSearchInput}
                  onChange={(e) => setEventsSearchInput(e.target.value)}
                  placeholder="Search events by title…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer">
                Search
              </button>
              {eventsSearch && (
                <button
                  type="button"
                  onClick={() => { setEventsSearch(""); setEventsSearchInput(""); setEventsPage(0); }}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-zinc-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {loadingEvents ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                <p className="text-xs text-gray-400 font-medium">
                  Loading events directory...
                </p>
              </div>
            ) : adminEvents.length === 0 ? (
              <div className="py-20 px-6 text-center bg-white border border-gray-200 rounded-2xl shadow-xs">
                <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-800">
                  No Events in Database
                </h3>
                <p className="text-xs text-gray-400 mt-1 mb-4 max-w-sm mx-auto">
                  Click the button below to add the first club gathering or open mic.
                </p>
                <button
                  type="button"
                  onClick={openAddEventModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Event</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 relative">
                        <Image
                          src={ev.image_url || "/image/logo.png"}
                          alt={ev.title}
                          fill
                          sizes="80px"
                          unoptimized={ev.image_url?.startsWith("http")}
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-sm font-bold text-zinc-800 truncate">
                            {ev.title}
                          </h3>
                          <span className="text-[11px] text-gray-400 flex-shrink-0">
                            #{ev.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          <span>
                            {ev.event_date
                              ? new Date(
                                  ev.event_date + "T00:00:00"
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Date to be announced"}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div>
                        {ev.registration_enabled ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold">
                            <span>Registration Open</span>
                            {ev.registration_url && (
                              <a
                                href={ev.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-800 hover:underline"
                                title="Open Google Form"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium">
                            No Registration Required
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditEventModal(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-zinc-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeletingEvent(ev);
                            setDeleteEventError(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Events Pagination */}
            {eventsTotalCount > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Showing {eventsPage * PAGE_SIZE + 1}–{Math.min((eventsPage + 1) * PAGE_SIZE, eventsTotalCount)} of {eventsTotalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={eventsPage === 0}
                    onClick={() => setEventsPage((p) => p - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs font-semibold text-zinc-700 px-2">
                    Page {eventsPage + 1} / {Math.ceil(eventsTotalCount / PAGE_SIZE)}
                  </span>
                  <button
                    type="button"
                    disabled={(eventsPage + 1) * PAGE_SIZE >= eventsTotalCount}
                    onClick={() => setEventsPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 3: MEMORIES MANAGEMENT ================= */}
        {mainSection === "memories" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-800">
                  Published Memories &amp; Visual Archives
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                  {memoriesTotalCount} Total
                </span>
              </div>

              <button
                type="button"
                onClick={openAddMemoryModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Memory</span>
              </button>
            </div>

            {/* Search bar for Memories */}
            <form
              onSubmit={(e) => { e.preventDefault(); setMemoriesPage(0); setMemoriesSearch(memoriesSearchInput); }}
              className="flex items-center gap-2 mb-5"
            >
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={memoriesSearchInput}
                  onChange={(e) => setMemoriesSearchInput(e.target.value)}
                  placeholder="Search memories by title…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer">
                Search
              </button>
              {memoriesSearch && (
                <button
                  type="button"
                  onClick={() => { setMemoriesSearch(""); setMemoriesSearchInput(""); setMemoriesPage(0); }}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-zinc-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {loadingMemories ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-gray-400 font-medium">
                  Loading memories archive...
                </p>
              </div>
            ) : adminMemories.length === 0 ? (
              <div className="py-20 px-6 text-center bg-white border border-gray-200 rounded-2xl shadow-xs">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-800">
                  No Memories in Archive
                </h3>
                <p className="text-xs text-gray-400 mt-1 mb-4 max-w-sm mx-auto">
                  Add the first event or competition memory with photo galleries and winner highlights.
                </p>
                <button
                  type="button"
                  onClick={openAddMemoryModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Memory</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminMemories.map((mem) => {
                  const isComp = mem.type === "competition";

                  return (
                    <div
                      key={mem.id}
                      className={`p-4 bg-white border-2 rounded-2xl shadow-xs flex flex-col justify-between gap-4 ${
                        isComp ? "border-amber-200" : "border-gray-200"
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* Cover Thumbnail */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 relative">
                          <Image
                            src={mem.cover_image_url || "/image/logo.png"}
                            alt={mem.title}
                            fill
                            sizes="96px"
                            unoptimized={mem.cover_image_url?.startsWith("http")}
                            className="object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-sm font-bold text-zinc-800 truncate">
                              {mem.title}
                            </h3>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              #{mem.id}
                            </span>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {isComp ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                                <Trophy className="w-3 h-3 text-amber-600" />
                                <span>Competition</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold">
                                <Sparkles className="w-3 h-3 text-sky-500" />
                                <span>Event</span>
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                              <Camera className="w-3 h-3 text-gray-500" />
                              <span>{mem.photos_count || 0} Photos</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {mem.event_date
                                ? new Date(
                                    mem.event_date + "T00:00:00"
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Date to be announced"}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                            {mem.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <Link
                          href={`/memories/${mem.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>Preview Public View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditMemoryModal(mem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-zinc-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Edit &amp; Photos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeletingMemory(mem);
                              setDeleteMemoryError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Memories Pagination */}
            {memoriesTotalCount > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Showing {memoriesPage * PAGE_SIZE + 1}–{Math.min((memoriesPage + 1) * PAGE_SIZE, memoriesTotalCount)} of {memoriesTotalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={memoriesPage === 0}
                    onClick={() => setMemoriesPage((p) => p - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-xs font-semibold text-zinc-700 px-2">
                    Page {memoriesPage + 1} / {Math.ceil(memoriesTotalCount / PAGE_SIZE)}
                  </span>
                  <button
                    type="button"
                    disabled={(memoriesPage + 1) * PAGE_SIZE >= memoriesTotalCount}
                    onClick={() => setMemoriesPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ADD / EDIT EVENT MODAL ================= */}
        {eventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-zinc-800">
                  {editingEvent ? `Edit Event: ${editingEvent.title}` : "Add New Event"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {eventFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{eventFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEvent} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Farzi Mushaira, Open Mic"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Provide event details, themes, venue, and highlights..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Event Date {editingEvent ? "(Optional for legacy events)" : "(Required for new event)"}
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Saved in real YYYY-MM-DD format. Highlights dates in the public calendar.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Event Poster / Artwork
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">
                    Maximum image size: 3 MB • Image will be optimized before upload
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {eventPosterPreview && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative flex-shrink-0">
                          <Image
                            src={eventPosterPreview}
                            alt="Poster preview"
                            fill
                            sizes="64px"
                            unoptimized={eventPosterPreview.startsWith("blob:") || eventPosterPreview.startsWith("http")}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          ref={fileInputRef}
                          disabled={eventPosterOptimizing}
                          onChange={handleEventFileChange}
                          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer disabled:opacity-50"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Supports PNG, JPG, or WEBP (Max 3 MB)
                        </p>
                      </div>
                    </div>

                    {eventPosterOptimizing && (
                      <div className="flex items-center gap-2 p-2 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-700">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 flex-shrink-0" />
                        <span>{eventPosterOptimizingStatus || "Optimizing poster image..."}</span>
                      </div>
                    )}

                    {eventPosterStats && !eventPosterOptimizing && (
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>Poster optimized successfully</span>
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700">
                          Original: {formatFileSize(eventPosterStats.originalSize)} • Optimized: {formatFileSize(eventPosterStats.optimizedSize)}
                          {eventPosterStats.savedPercentage > 0 && ` (-${eventPosterStats.savedPercentage}%)`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventRegEnabled}
                      onChange={(e) => setEventRegEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-zinc-700">
                      Registration required (Display &quot;Register Now&quot; button)
                    </span>
                  </label>

                  {eventRegEnabled && (
                    <div className="pt-2 animate-in fade-in duration-150">
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                        Google Form / Registration URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        required={eventRegEnabled}
                        value={eventRegUrl}
                        onChange={(e) => setEventRegUrl(e.target.value)}
                        placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Opens safely in a new browser tab when visitors tap Register Now.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={eventFormSaving}
                    onClick={() => setEventModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={eventFormSaving || eventPosterOptimizing}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {eventFormSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : eventPosterOptimizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimizing Poster...</span>
                      </>
                    ) : (
                      <span>{editingEvent ? "Update Event" : "Create Event"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= ADD / EDIT MEMORY MODAL ================= */}
        {memoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-gray-200 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-800">
                      {editingMemory ? `Edit Memory: ${editingMemory.title}` : "Add New Memory"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Configure memory metadata, photo gallery, and competition winners.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMemoryModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {memoryFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{memoryFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveMemory} className="space-y-5 text-left">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Memory Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={memoryTitle}
                    onChange={(e) => setMemoryTitle(e.target.value)}
                    placeholder="e.g. Grandstand 5.0, Farzi Mushaira, Open Mic"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={memoryDescription}
                    onChange={(e) => setMemoryDescription(e.target.value)}
                    placeholder="Describe the occasion, atmosphere, performers, or significance..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Date & Type Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Event Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={memoryDate}
                      onChange={(e) => setMemoryDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Memory Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={memoryType}
                      onChange={(e) => setMemoryType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="event">Club Gathering / Event</option>
                      <option value="competition">Competition / Contest</option>
                    </select>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Cover Photo
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">
                    Maximum image size: 3 MB • Image will be optimized before upload
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {memoryCoverPreview && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative flex-shrink-0">
                          <Image
                            src={memoryCoverPreview}
                            alt="Cover preview"
                            fill
                            sizes="80px"
                            unoptimized={memoryCoverPreview.startsWith("blob:") || memoryCoverPreview.startsWith("http")}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          ref={memoryCoverInputRef}
                          disabled={memoryCoverOptimizing}
                          onChange={handleMemoryCoverChange}
                          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer disabled:opacity-50"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Supports PNG, JPG, or WEBP (Max 3 MB)
                        </p>
                      </div>
                    </div>

                    {memoryCoverOptimizing && (
                      <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />
                        <span>{memoryCoverOptimizingStatus || "Optimizing cover image..."}</span>
                      </div>
                    )}

                    {memoryCoverStats && !memoryCoverOptimizing && (
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>Cover optimized successfully</span>
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700">
                          Original: {formatFileSize(memoryCoverStats.originalSize)} • Optimized: {formatFileSize(memoryCoverStats.optimizedSize)}
                          {memoryCoverStats.savedPercentage > 0 && ` (-${memoryCoverStats.savedPercentage}%)`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= EDITING EXISTING: GALLERY PHOTOS MANAGER ================= */}
                {editingMemory && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold text-zinc-800">
                            Gallery Photographs ({memoryPhotos.length})
                          </h4>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                          Maximum image size: 3 MB per image • Images will be optimized before upload
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
                        {uploadingPhotos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{uploadingPhotos ? "Optimizing & Uploading..." : "Upload Photos"}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/webp"
                          disabled={uploadingPhotos}
                          onChange={handleUploadGalleryPhotos}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {memoryPhotos.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">
                        No additional gallery photos uploaded yet. Tap &quot;Upload Photos&quot; to add multiple images.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                        {memoryPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs"
                          >
                            <div className="w-full h-24 relative bg-gray-100">
                              <img
                                src={photo.image_url}
                                alt="Gallery thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
                                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {photo.caption && (
                              <p className="text-[10px] text-gray-500 p-1 truncate">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ================= EDITING EXISTING: COMPETITION WINNERS MANAGER ================= */}
                {editingMemory && memoryType === "competition" && (
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-amber-900">
                        Competition Winners ({memoryWinners.length})
                      </h4>
                    </div>

                    {/* Current Winners List */}
                    {memoryWinners.length > 0 && (
                      <div className="space-y-2">
                        {memoryWinners.map((w) => (
                          <div
                            key={w.id}
                            className="p-2.5 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-50 border border-amber-200 relative flex-shrink-0">
                                {w.image_url ? (
                                  <Image
                                    src={w.image_url}
                                    alt={w.name}
                                    fill
                                    sizes="40px"
                                    unoptimized={w.image_url.startsWith("http")}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-amber-400">
                                    <User className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-800 truncate">
                                  {w.name}
                                </p>
                                {w.position && (
                                  <p className="text-[10px] font-semibold text-amber-700">
                                    {w.position}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteWinner(w.id, w.image_url)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete winner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Winner Sub-Form */}
                    <div className="pt-2 border-t border-amber-200/60 space-y-3">
                      <p className="text-[11px] font-bold text-amber-800">
                        + Add a Winner to this Competition
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newWinnerName}
                          onChange={(e) => setNewWinnerName(e.target.value)}
                          placeholder="Winner Name *"
                          className="px-3 py-1.5 text-xs border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                        <input
                          type="text"
                          value={newWinnerPos}
                          onChange={(e) => setNewWinnerPos(e.target.value)}
                          placeholder="Position (e.g. 1st Place, Best Poet)"
                          className="px-3 py-1.5 text-xs border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newWinnerDesc}
                          onChange={(e) => setNewWinnerDesc(e.target.value)}
                          placeholder="Optional citation or poem snippet"
                          className="px-3 py-1.5 text-xs border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-amber-800 font-medium">
                            Max size: 3 MB • Photo will be optimized before upload
                          </p>
                          <div className="flex items-center gap-2">
                            {newWinnerPreview && (
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-amber-100 border border-amber-300 relative flex-shrink-0">
                                <Image
                                  src={newWinnerPreview}
                                  alt="Winner preview"
                                  fill
                                  sizes="28px"
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              disabled={newWinnerOptimizing}
                              onChange={handleWinnerFileChange}
                              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer disabled:opacity-50"
                            />
                          </div>
                          {newWinnerOptimizing && (
                            <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Optimizing photo...
                            </p>
                          )}
                          {newWinnerStats && !newWinnerOptimizing && (
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              ✓ Optimized ({formatFileSize(newWinnerStats.optimizedSize)})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={addingWinner || newWinnerOptimizing || !newWinnerName.trim()}
                          onClick={handleAddWinner}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {addingWinner ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : newWinnerOptimizing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>Save Winner</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={memoryFormSaving}
                    onClick={() => setMemoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={memoryFormSaving || memoryCoverOptimizing}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {memoryFormSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : memoryCoverOptimizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimizing Cover...</span>
                      </>
                    ) : (
                      <span>{editingMemory ? "Update Memory" : "Create Memory"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= DELETE EVENT MODAL ================= */}
        {deletingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-xl text-left">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-zinc-800">
                Delete Event?
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete &quot;{deletingEvent.title}&quot;? Its schedule, poster, and registration settings will be removed.
              </p>

              {deleteEventError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3">
                  {deleteEventError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 mt-6">
                <button
                  type="button"
                  disabled={deleteEventLoading}
                  onClick={() => setDeletingEvent(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleteEventLoading}
                  onClick={handleConfirmDeleteEvent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleteEventLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= DELETE MEMORY MODAL ================= */}
        {deletingMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-xl text-left">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-zinc-800">
                Delete Memory Archive?
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete &quot;{deletingMemory.title}&quot;? All associated gallery photos and winner records will be removed.
              </p>

              {deleteMemoryError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3">
                  {deleteMemoryError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 mt-6">
                <button
                  type="button"
                  disabled={deleteMemoryLoading}
                  onClick={() => setDeletingMemory(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleteMemoryLoading}
                  onClick={handleConfirmDeleteMemory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleteMemoryLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTIVITY LOG SECTION ================= */}
        {mainSection === "logs" && (
          <div className="space-y-4">
            {/* Filter + Refresh bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                {(["all", "posts", "events", "memories", "admins"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setLogsFilter(f); fetchActivityLogs(f); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      logsFilter === f
                        ? "bg-white text-zinc-800 shadow-xs"
                        : "text-gray-500 hover:text-zinc-800"
                    }`}
                  >
                    {f === "all" ? "All Actions" : f}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fetchActivityLogs(logsFilter)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {/* Log Table */}
            {loadingLogs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="ml-2 text-sm text-gray-500">Loading activity logs...</span>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <ClipboardList className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No activity logs yet.</p>
                <p className="text-xs text-gray-400 mt-1">Activity will appear here once the SQL triggers are applied in Supabase.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">When</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">Who</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">Action</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">Table</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-600">Description</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">Record ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activityLogs.map((log) => {
                      const actionColor =
                        log.action === "INSERT"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : log.action === "DELETE"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200";
                      const tableColor =
                        log.table_name === "posts"
                          ? "bg-sky-50 text-sky-700"
                          : log.table_name === "events"
                          ? "bg-purple-50 text-purple-700"
                          : log.table_name === "admins"
                          ? "bg-red-50 text-red-700"
                          : "bg-indigo-50 text-indigo-700";

                      return (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* When */}
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            <div>{new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                            <div className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                          </td>
                          {/* Who */}
                          <td className="px-4 py-3 max-w-[160px]">
                            <div className="font-medium text-zinc-800 truncate">{log.user_email || "—"}</div>
                            <div className="text-[10px] text-gray-400 font-mono truncate">{log.user_id?.slice(0, 12)}…</div>
                          </td>
                          {/* Action */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionColor}`}>
                              {log.action}
                            </span>
                          </td>
                          {/* Table */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${tableColor}`}>
                              {log.table_name}
                            </span>
                          </td>
                          {/* Description */}
                          <td className="px-4 py-3 text-zinc-700 max-w-xs">
                            {log.description || "—"}
                          </td>
                          {/* Record ID */}
                          <td className="px-4 py-3 font-mono text-gray-400">
                            #{log.record_id ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= LIGHTBOX MODAL ================= */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged Shayari Artwork"
                className="max-h-[85vh] max-w-full w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
