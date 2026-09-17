"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
} from "lucide-react";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import { getAvatarFromUser } from "@/utils/profile";

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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Section switcher: Shayari Moderation vs Events Management vs Memories Management
  const [mainSection, setMainSection] = useState<"shayari" | "events" | "memories">("shayari");

  // Feedback banner
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ----------------- 1. SHAYARI STATE -----------------
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
  const [eventFormSaving, setEventFormSaving] = useState(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  // Delete event confirmation modal state
  const [deletingEvent, setDeletingEvent] = useState<AdminEvent | null>(null);
  const [deleteEventLoading, setDeleteEventLoading] = useState(false);
  const [deleteEventError, setDeleteEventError] = useState<string | null>(null);

  // ----------------- 3. MEMORIES STATE -----------------
  const [adminMemories, setAdminMemories] = useState<AdminMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Memory Add / Edit Modal state
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AdminMemory | null>(null);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryDescription, setMemoryDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [memoryType, setMemoryType] = useState<"event" | "competition">("event");
  const [memoryCoverFile, setMemoryCoverFile] = useState<File | null>(null);
  const [memoryCoverPreview, setMemoryCoverPreview] = useState<string | null>(null);
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
        console.error("Admin check failed:", err);
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

  // 2. Fetch posts whenever activeTab changes
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    async function fetchPostsForModeration() {
      try {
        setLoadingPosts(true);

        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("id, user_id, content, image_url, status, created_at, updated_at")
          .eq("status", activeTab)
          .order("created_at", { ascending: activeTab === "pending" });

        if (postsError) throw postsError;

        // Fetch corresponding author profiles
        const userIds = [
          ...new Set((postsData || []).map((p) => p.user_id).filter(Boolean)),
        ];

        let profilesMap: Record<string, { name?: string; photo_url?: string }> =
          {};

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
            // Author resolution architecture:
            // 1. public.profiles.name via posts.user_id
            // 2. fallback "Anonymous"
            const authorProfile = p.user_id ? profilesMap[p.user_id] : null;
            const displayAuthor = authorProfile?.name?.trim() || "Anonymous";

            const authorPhoto =
              authorProfile?.photo_url?.trim() ||
              (p.user_id && p.user_id === user?.id
                ? getAvatarFromUser(user)
                : null) ||
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
            };
          });

          setPosts(formatted);
        }
      } catch (err: any) {
        console.error("Error fetching posts for moderation:", err);
        if (isMounted) {
          setFeedbackMessage({
            type: "error",
            text:
              err.message ||
              "Failed to load moderation posts. Please try again.",
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
  }, [isAdmin, activeTab]);

  // 3. Fetch events
  const fetchAdminEvents = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setAdminEvents(data || []);
    } catch (err: any) {
      console.error("Failed to load admin events:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to load events.",
      });
    } finally {
      setLoadingEvents(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminEvents();
    }
  }, [isAdmin, fetchAdminEvents]);

  // 4. Fetch memories
  const fetchAdminMemories = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoadingMemories(true);
      const { data, error } = await supabase
        .from("memories")
        .select("*, memory_photos(id)")
        .order("id", { ascending: false });

      if (error) throw error;

      const formatted: AdminMemory[] = (data || []).map((row: any) => ({
        ...row,
        photos_count: Array.isArray(row.memory_photos) ? row.memory_photos.length : 0,
      }));

      setAdminMemories(formatted);
    } catch (err: any) {
      console.error("Failed to load admin memories:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to load memories.",
      });
    } finally {
      setLoadingMemories(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminMemories();
    }
  }, [isAdmin, fetchAdminMemories]);

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

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setFeedbackMessage({
        type: "success",
        text: `Post #${postId} has been approved successfully!`,
      });
    } catch (err: any) {
      console.error("Approve error:", err);
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
      console.error("Reject error:", err);
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
    setEditingEvent(null);
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventRegEnabled(false);
    setEventRegUrl("");
    setEventPosterFile(null);
    setEventPosterPreview(null);
    setEventFormError(null);
    setEventModalOpen(true);
  };

  const openEditEventModal = (event: AdminEvent) => {
    setEditingEvent(event);
    setEventTitle(event.title || "");
    setEventDescription(event.description || "");
    setEventDate(event.event_date || "");
    setEventRegEnabled(Boolean(event.registration_enabled));
    setEventRegUrl(event.registration_url || "");
    setEventPosterFile(null);
    setEventPosterPreview(event.image_url || null);
    setEventFormError(null);
    setEventModalOpen(true);
  };

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEventPosterFile(file);
      const objUrl = URL.createObjectURL(file);
      setEventPosterPreview(objUrl);
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

    try {
      setEventFormSaving(true);
      let finalImageUrl = editingEvent ? editingEvent.image_url : "/image/logo.png";

      if (eventPosterFile && user) {
        const cleanName = eventPosterFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${user.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(filePath, eventPosterFile, {
            cacheControl: "3600",
            upsert: false,
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
      fetchAdminEvents();
    } catch (err: any) {
      console.error("Save event error:", err);
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
          console.warn("Storage cleanup notice:", cleanupErr);
        }
      }

      setFeedbackMessage({
        type: "success",
        text: `Event "${deletingEvent.title}" was deleted permanently.`,
      });

      setDeletingEvent(null);
      fetchAdminEvents();
    } catch (err: any) {
      console.error("Delete event error:", err);
      setDeleteEventError(err.message || "Failed to delete event. Please try again.");
    } finally {
      setDeleteEventLoading(false);
    }
  };

  // ----------------- MEMORY MODAL HELPERS -----------------
  const openAddMemoryModal = () => {
    setEditingMemory(null);
    setMemoryTitle("");
    setMemoryDescription("");
    setMemoryDate("");
    setMemoryType("event");
    setMemoryCoverFile(null);
    setMemoryCoverPreview(null);
    setMemoryPhotos([]);
    setMemoryWinners([]);
    setMemoryFormError(null);
    setMemoryModalOpen(true);
  };

  const openEditMemoryModal = async (mem: AdminMemory) => {
    setEditingMemory(mem);
    setMemoryTitle(mem.title || "");
    setMemoryDescription(mem.description || "");
    setMemoryDate(mem.event_date || "");
    setMemoryType(mem.type || "event");
    setMemoryCoverFile(null);
    setMemoryCoverPreview(mem.cover_image_url || null);
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
      console.error("Failed to load memory photos/winners:", fetchErr);
    }
  };

  const handleMemoryCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMemoryCoverFile(file);
      setMemoryCoverPreview(URL.createObjectURL(file));
    }
  };

  // Upload Multiple Photos to Memory
  const handleUploadGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    if (!editingMemory) {
      setMemoryFormError("Please save the memory first before uploading gallery photos.");
      return;
    }

    try {
      setUploadingPhotos(true);
      setMemoryFormError(null);
      const files = Array.from(e.target.files);

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const cleanName = f.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${editingMemory.id}/${Date.now()}-${i}-${cleanName}`;

        const { error: upErr } = await supabase.storage
          .from("memory-images")
          .upload(filePath, f, { cacheControl: "3600", upsert: false });

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
      fetchAdminMemories();
    } catch (err: any) {
      console.error("Gallery upload error:", err);
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
          console.warn("Storage delete notice:", sErr);
        }
      }

      setMemoryPhotos((prev) => prev.filter((p) => p.id !== photoId));
      fetchAdminMemories();
    } catch (err: any) {
      console.error("Failed to delete photo:", err);
      setMemoryFormError(err.message || "Failed to delete photo.");
    }
  };

  // Add winner
  const handleAddWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;
    if (!newWinnerName.trim()) {
      setMemoryFormError("Winner name is required.");
      return;
    }

    try {
      setAddingWinner(true);
      setMemoryFormError(null);
      let winnerImageUrl: string | null = null;

      if (newWinnerFile && user) {
        const cleanName = newWinnerFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${editingMemory.id}/winners/${Date.now()}-${cleanName}`;

        const { error: upErr } = await supabase.storage
          .from("memory-images")
          .upload(filePath, newWinnerFile, { cacheControl: "3600", upsert: false });

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
      setNewWinnerFile(null);
    } catch (err: any) {
      console.error("Failed to add winner:", err);
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
          console.warn("Storage winner delete notice:", sErr);
        }
      }

      setMemoryWinners((prev) => prev.filter((w) => w.id !== winnerId));
    } catch (err: any) {
      console.error("Failed to delete winner:", err);
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

    try {
      setMemoryFormSaving(true);
      let finalCoverUrl = editingMemory ? editingMemory.cover_image_url : null;

      if (memoryCoverFile && user) {
        const cleanName = memoryCoverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `covers/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-images")
          .upload(filePath, memoryCoverFile, {
            cacheControl: "3600",
            upsert: false,
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
      fetchAdminMemories();
    } catch (err: any) {
      console.error("Save memory error:", err);
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
          console.warn("Storage cleanup note:", cleanupErr);
        }
      }

      setFeedbackMessage({
        type: "success",
        text: `Memory "${deletingMemory.title}" was deleted permanently.`,
      });

      setDeletingMemory(null);
      fetchAdminMemories();
    } catch (err: any) {
      console.error("Delete memory error:", err);
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
                : "Memories Management Console"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {mainSection === "shayari"
                ? "Review and moderate member submissions before they appear on the public feed."
                : mainSection === "events"
                ? "Add, edit, reschedule, or remove club events and configure registration links."
                : "Publish visual memories, upload gallery photos, and showcase competition winners."}
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
              fetchAdminEvents();
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
              fetchAdminMemories();
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
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-gray-500 hover:text-zinc-800 hover:bg-gray-100"
                }`}
              >
                Pending Review {activeTab === "pending" && `(${posts.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-zinc-800 hover:bg-gray-100"
                }`}
              >
                Approved {activeTab === "approved" && `(${posts.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("rejected")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === "rejected"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-zinc-800 hover:bg-gray-100"
                }`}
              >
                Rejected {activeTab === "rejected" && `(${posts.length})`}
              </button>
            </div>

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
              <div className="space-y-4">
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
                      <p className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed pl-1">
                        {post.content}
                      </p>

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

                      {/* 4. Approve / Reject Controls (Below the Post Image) */}
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                        {/* Tab: Pending Review */}
                        {activeTab === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleReject(post.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              <span>Reject</span>
                            </button>

                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleApprove(post.id)}
                              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>
                          </>
                        )}

                        {/* Tab: Approved */}
                        {activeTab === "approved" && (
                          <>
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-300 opacity-80 cursor-default select-none"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved (Current)</span>
                            </button>

                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleReject(post.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Tab: Rejected */}
                        {activeTab === "rejected" && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleApprove(post.id)}
                              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-300 opacity-80 cursor-default select-none"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Rejected (Current)</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= SECTION 2: EVENTS MANAGEMENT ================= */}
        {mainSection === "events" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-800">
                  Scheduled Events Directory
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                  {adminEvents.length} Total
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
          </div>
        )}

        {/* ================= SECTION 3: MEMORIES MANAGEMENT ================= */}
        {mainSection === "memories" && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-800">
                  Published Memories &amp; Visual Archives
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                  {adminMemories.length} Total
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
                  <div className="flex items-center gap-3">
                    {eventPosterPreview && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative flex-shrink-0">
                        <Image
                          src={eventPosterPreview}
                          alt="Poster preview"
                          fill
                          unoptimized={eventPosterPreview.startsWith("blob:") || eventPosterPreview.startsWith("http")}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleEventFileChange}
                        className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Uploads directly to Supabase storage bucket `event-images`.
                      </p>
                    </div>
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
                    disabled={eventFormSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {eventFormSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
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
                  <div className="flex items-center gap-3">
                    {memoryCoverPreview && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative flex-shrink-0">
                        <Image
                          src={memoryCoverPreview}
                          alt="Cover preview"
                          fill
                          unoptimized={memoryCoverPreview.startsWith("blob:") || memoryCoverPreview.startsWith("http")}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        ref={memoryCoverInputRef}
                        onChange={handleMemoryCoverChange}
                        className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Uploads directly to Supabase storage bucket `memory-images`.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ================= EDITING EXISTING: GALLERY PHOTOS MANAGER ================= */}
                {editingMemory && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-zinc-800">
                          Gallery Photographs ({memoryPhotos.length})
                        </h4>
                      </div>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingPhotos ? "Uploading..." : "Upload Photos"}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
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
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setNewWinnerFile(e.target.files[0]);
                          }}
                          className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={addingWinner || !newWinnerName.trim()}
                          onClick={handleAddWinner}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {addingWinner ? (
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
                    disabled={memoryFormSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {memoryFormSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
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
