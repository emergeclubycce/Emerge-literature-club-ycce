"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import supabase from "@/config/supabase";
import { User, Mail, Instagram, Image as ImageIcon, Save, ArrowLeft, CheckCircle2, AlertCircle, Loader2, History } from "lucide-react";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import { syncUserProfile, getAvatarFromUser, getNameFromUser } from "@/utils/profile";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();

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
        setEmail(currentUser.email || "");

        // Synchronize / fetch profile record from public.profiles
        const profileData = await syncUserProfile(currentUser);

        if (!isMounted) return;

        const oauthName = getNameFromUser(currentUser) || "";
        const oauthPhoto = getAvatarFromUser(currentUser) || "";

        if (profileData) {
          setName(profileData.name || oauthName);
          setPhotoUrl(profileData.photo_url || oauthPhoto);
          setInstagram(profileData.instagram || "");
        } else {
          setName(oauthName);
          setPhotoUrl(oauthPhoto);
          setInstagram("");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        if (isMounted) router.push("/auth/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let updateError = null;

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update({
            name: name.trim(),
            photo_url: photoUrl.trim(),
            instagram: instagram.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        updateError = error;
      } else {
        const { error } = await supabase.from("profiles").insert({
          user_id: user.id,
          name: name.trim(),
          photo_url: photoUrl.trim(),
          instagram: instagram.trim(),
        });
        updateError = error;
      }

      if (updateError) throw updateError;

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 flex flex-col justify-between`}>
      <main className="w-full max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700">
                Profile Settings
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Manage your personal information and presence on eMerge Literature Club.
              </p>
            </div>

            <Link
              href="/profile/history"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors w-fit"
            >
              <History className="w-3.5 h-3.5" />
              <span>Your Activity</span>
            </Link>
          </div>

          {/* Feedback Messages */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 pb-6 border-b border-gray-100">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-inner">
              {photoUrl && !imageError ? (
                <Image
                  src={photoUrl}
                  alt="Profile Avatar"
                  width={96}
                  height={96}
                  unoptimized
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold text-zinc-800">
                {name || "Club Member"}
              </h2>
              <p className="text-xs text-gray-500">{email}</p>
              <p className="text-[11px] text-gray-400 mt-2">
                Your profile photo is displayed across comments, shers, and in the navbar.
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Photo URL */}
            <div>
              <label
                htmlFor="photoUrl"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
              >
                Profile Photo URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="photoUrl"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => {
                    setPhotoUrl(e.target.value);
                    setImageError(false);
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Provide a direct image URL (e.g. from Google, GitHub, or public hosting).
              </p>
            </div>

            {/* Instagram */}
            <div>
              <label
                htmlFor="instagram"
                className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
              >
                Instagram Handle or Link
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Instagram className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@yourusername or https://instagram.com/..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
              >
                Email Address (Read-only)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Your email is associated with your Google sign-in and cannot be changed.
              </p>
            </div>

            {/* Account ID (Read-Only) */}
            <div>
              <label
                htmlFor="userId"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
              >
                User ID (Read-only)
              </label>
              <input
                id="userId"
                type="text"
                value={user?.id || ""}
                disabled
                className="w-full px-3.5 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono text-gray-400 cursor-not-allowed select-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
