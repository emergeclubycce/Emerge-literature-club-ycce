"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import supabase from "@/config/supabase";
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Feather,
} from "lucide-react";
import Footer from "@/app/components/reuseable/reusable-home/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function SubmitShayariPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authenticate user on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data?.user) {
          if (authError?.message?.toLowerCase().includes("refresh token")) {
            await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          }
          if (isMounted) router.push("/auth/login");
          return;
        }

        if (isMounted) {
          setUser(data.user);
          setAuthChecking(false);
        }
      } catch {
        if (isMounted) router.push("/auth/login");
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Clean up object URL when selectedFile changes
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedContent = content.trim();
    if (!trimmedContent && !selectedFile) {
      setError("Please write something or upload an image.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let uploadedFilePath: string | null = null;
    let uploadedImageUrl: string | null = null;

    try {
      // 1. Upload image if selected
      if (selectedFile) {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        uploadedFilePath = `${user.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(uploadedFilePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(uploadedFilePath);

        uploadedImageUrl = urlData.publicUrl;
      }

      // 2. Insert post row with status = 'pending'
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: trimmedContent,
        image_url: uploadedImageUrl,
        status: "pending",
      });

      if (insertError) {
        // Attempt cleanup of orphaned uploaded image
        if (uploadedFilePath) {
          try {
            await supabase.storage
              .from("post-images")
              .remove([uploadedFilePath]);
          } catch (cleanupErr) {
            console.error("Storage cleanup failed:", cleanupErr);
          }
        }
        throw insertError;
      }

      // Success
      setSubmitted(true);
    } catch (err: any) {
      console.error("Shayari submission error:", err);
      setError(
        err.message || "Failed to submit your Shayari. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <div
        className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500">Checking authentication...</p>
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
            href="/shers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sher-Shayari</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-10 shadow-sm">
          {submitted ? (
            /* Success State */
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-800 mb-2">
                Shayari Submitted!
              </h2>
              <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
                Your Shayari has been submitted for review. Once an administrator
                approves it, it will be published to the public Sher-Shayari feed.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shers"
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Return to Feed
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setContent("");
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setSubmitted(false);
                  }}
                  className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-zinc-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <>
              <div className="border-b border-gray-100 pb-5 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                  <Feather className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-800">
                    Submit a Shayari
                  </h1>
                  <p className="text-xs text-gray-500">
                    Express your thoughts and share your poetry with the club.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 text-red-800 border border-red-200 text-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Content Textarea */}
                <div>
                  <label
                    htmlFor="content"
                    className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
                  >
                    Shayari / Poem Content <span className="text-gray-400 font-normal">(Optional if image provided)</span>
                  </label>
                  <textarea
                    id="content"
                    rows={6}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="लिखिए अपने दिल के अल्फ़ाज़...&#10;Write your lines here (or upload an image below)..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-zinc-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all leading-relaxed placeholder:text-gray-400"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Format line breaks as you would like them to appear on the card.
                  </p>
                </div>

                {/* Optional Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                    Artwork / Photo <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>

                  {previewUrl ? (
                    <div className="relative border-2 border-gray-200 rounded-xl p-2 bg-gray-50 overflow-hidden flex flex-col items-center">
                      <div className="relative max-h-72 w-full flex items-center justify-center overflow-hidden rounded-lg">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove Image</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-sky-400 hover:bg-sky-50/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-sky-100 flex items-center justify-center text-gray-500 group-hover:text-sky-600 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-700">
                          Click to upload an image
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          PNG, JPG, or WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Link
                    href="/shers"
                    className="px-5 py-2.5 text-xs font-medium text-gray-500 hover:text-zinc-800 transition-colors"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit for Review</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
