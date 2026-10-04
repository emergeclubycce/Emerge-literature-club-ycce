"use client";

import { logger } from "@/utils/logger";
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Heading,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import clsx from "clsx";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import { serializeEditorToFormattedText } from "@/utils/posts";
import {
  validateImageFile,
  optimizeImage,
  formatFileSize,
  type OptimizedImageResult,
} from "@/utils/imageOptimizer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function SubmitShayariPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [content, setContent] = useState("");
  const [rawText, setRawText] = useState("");
  const [isHeader, setIsHeader] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedImageResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizingStatus, setOptimizingStatus] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Check which formatting commands are active at the current cursor / selection
  const updateActiveFormats = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      const block = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      setIsHeader(block === "h1" || block === "h2" || block === "h3" || block === "h4" || block === "header");
    } catch {
      // Ignore if document is unavailable or selection is outside
    }
  }, []);

  // Serialize the editor DOM to canonical formatting and plainText
  const syncState = useCallback(() => {
    if (!editorRef.current) return;
    const { formatted, plainText } = serializeEditorToFormattedText(editorRef.current);
    setContent(formatted);
    setRawText(plainText);
    if (error && (plainText.length > 0 || selectedFile)) {
      setError(null);
    }
    updateActiveFormats();
  }, [error, selectedFile, updateActiveFormats]);

  // Keep toolbar active states in sync with cursor position
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editorRef.current) return;
      const sel = window.getSelection();
      if (sel && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
        updateActiveFormats();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateActiveFormats]);

  // Execute formatting on selected text or at cursor
  const toggleFormat = (command: "bold" | "italic" | "underline") => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false);
      syncState();
    }
  };

  // Toggle Header (Heading block)
  const toggleHeader = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const currentBlock = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      if (currentBlock === "h3" || currentBlock === "h2" || currentBlock === "h1") {
        document.execCommand("formatBlock", false, "<p>");
      } else {
        document.execCommand("formatBlock", false, "<h3>");
      }
      syncState();
    }
  };

  // Keyboard shortcuts (Ctrl+B / Cmd+B, Ctrl+I, Ctrl+U)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        toggleFormat("bold");
      } else if (key === "i") {
        e.preventDefault();
        toggleFormat("italic");
      } else if (key === "u") {
        e.preventDefault();
        toggleFormat("underline");
      }
    }
  };

  // Clean plain-text paste handler to prevent external CSS/script injection
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    syncState();
  };

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

  // Clean up object URL when previewUrl changes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. FRONTEND VALIDATION MUST HAPPEN FIRST
    const validation = validateImageFile(file, "shers");
    if (!validation.valid) {
      setError(validation.error || "Image is too large. Maximum allowed size is 1 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setOptimizedResult(null);
    setOptimizing(true);
    setOptimizingStatus("Optimizing image...");

    try {
      // 2. FRONTEND ADAPTIVE OPTIMIZATION
      const result = await optimizeImage(file, "shers", {
        onStatusChange: (status) => setOptimizingStatus(status),
      });

      setSelectedFile(result.file);
      setPreviewUrl(result.previewUrl);
      setOptimizedResult(result);
      setOptimizingStatus(`Image optimized — ${formatFileSize(result.optimizedSize)}`);
    } catch (err: any) {
      logger.error("Sher image optimization error:", err);
      setError(err.message || "Unable to optimize this image. Please try another image.");
      setSelectedFile(null);
      setPreviewUrl(null);
      setOptimizedResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setOptimizing(false);
    }
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setOptimizedResult(null);
    setOptimizingStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const isTextEmpty = rawText.trim().length === 0;
    const trimmedContent = isTextEmpty ? "" : content.trim();

    if (isTextEmpty && !selectedFile) {
      setError("Please write something or upload an image.");
      return;
    }

    // --- Rate limiting: max 1 submission per 60 seconds per user ---
    try {
      const { data: recentPost } = await supabase
        .from("posts")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentPost?.created_at) {
        const secondsSinceLast = (Date.now() - new Date(recentPost.created_at).getTime()) / 1000;
        if (secondsSinceLast < 60) {
          const remaining = Math.ceil(60 - secondsSinceLast);
          setError(`Please wait ${remaining} seconds before submitting again.`);
          return;
        }
      }
    } catch {
      // If the rate-limit check itself fails, allow submission to proceed
    }

    setSubmitting(true);
    setError(null);

    let uploadedFilePath: string | null = null;
    let uploadedImageUrl: string | null = null;

    try {
      // 1. Upload ONLY optimized image if selected
      if (selectedFile) {
        // Final size validation safeguard
        if (selectedFile.size > 1 * 1024 * 1024) {
          throw new Error("Image is too large. Maximum allowed size is 1 MB.");
        }

        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        uploadedFilePath = `${user.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(uploadedFilePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type || "image/webp",
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
      const postPayload: Record<string, any> = {
        user_id: user.id,
        content: trimmedContent || null,
        image_url: uploadedImageUrl,
        status: "pending",
        author_email: user.email ?? null,
      };

      let { error: insertError } = await supabase.from("posts").insert(postPayload);

      if (insertError && (insertError.message?.includes("author_email") || (insertError as any).code === "PGRST204")) {
        delete postPayload.author_email;
        const retry = await supabase.from("posts").insert(postPayload);
        insertError = retry.error;
      }

      if (insertError) {
        // Attempt cleanup of orphaned uploaded image
        if (uploadedFilePath) {
          try {
            await supabase.storage
              .from("post-images")
              .remove([uploadedFilePath]);
          } catch (cleanupErr) {
            logger.error("Storage cleanup failed:", cleanupErr);
          }
        }
        throw insertError;
      }

      // Success — fire submission email (non-blocking, don't fail the UX if email fails)
      try {
        const userEmail = user?.email;
        const userName = user?.user_metadata?.full_name ?? user?.email ?? "there";
        if (userEmail) {
          fetch("/api/email/submission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userEmail,
              name: userName,
              preview: trimmedContent,
            }),
          }).catch(() => {}); // swallow silently — email failure should not break UX
        }
      } catch {
        // email errors are non-fatal
      }

      setSubmitted(true);
    } catch (err: any) {
      logger.error("Shayari submission error:", err);
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
                    setRawText("");
                    if (editorRef.current) {
                      editorRef.current.innerHTML = "";
                    }
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setOptimizedResult(null);
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
                  <h1 className="text-3xl font-bold text-zinc-800 leading-tight tracking-tight">
                    Submit a <span className="italic font-bold text-sky-600">Shayari</span>
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
                {/* Content Rich-Text Area with WYSIWYG Formatting Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider"
                    >
                      Shayari / Poem Content <span className="text-gray-400 font-normal">(Optional if image provided)</span>
                    </label>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all bg-white shadow-2xs">
                    {/* Formatting Toolbar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50/90 border-b border-gray-200/80">
                      <div className="flex items-center gap-1">
                        {/* Header Button */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleHeader();
                          }}
                          title="Header (Heading)"
                          aria-label="Header"
                          className={clsx(
                            "h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                            isHeader
                              ? "bg-sky-100 text-sky-700 font-bold border border-sky-300 shadow-2xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-gray-200/60 border border-transparent"
                          )}
                        >
                          <Heading className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span className="font-bold text-xs">Header</span>
                        </button>

                        {/* Bold Button */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleFormat("bold");
                          }}
                          title="Bold (Ctrl+B)"
                          aria-label="Bold"
                          className={clsx(
                            "h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                            isBold
                              ? "bg-sky-100 text-sky-700 font-bold border border-sky-300 shadow-2xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-gray-200/60 border border-transparent"
                          )}
                        >
                          <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span className="font-bold text-xs">Bold</span>
                        </button>

                        {/* Italic Button */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleFormat("italic");
                          }}
                          title="Italic (Ctrl+I)"
                          aria-label="Italic"
                          className={clsx(
                            "h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                            isItalic
                              ? "bg-sky-100 text-sky-700 font-bold border border-sky-300 shadow-2xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-gray-200/60 border border-transparent"
                          )}
                        >
                          <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span className="italic text-xs">Italic</span>
                        </button>

                        {/* Underline Button */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleFormat("underline");
                          }}
                          title="Underline (Ctrl+U)"
                          aria-label="Underline"
                          className={clsx(
                            "h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none",
                            isUnderline
                              ? "bg-sky-100 text-sky-700 font-bold border border-sky-300 shadow-2xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-gray-200/60 border border-transparent"
                          )}
                        >
                          <Underline className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span className="underline text-xs">Underline</span>
                        </button>
                      </div>

                      <span className="hidden sm:inline-block text-[11px] text-gray-400 select-none">
                        Shortcuts: Ctrl+B • Ctrl+I • Ctrl+U
                      </span>
                    </div>

                    {/* WYSIWYG Editable Surface */}
                    <div
                      className="relative min-h-[160px] max-h-[420px] overflow-y-auto cursor-text"
                      onClick={() => {
                        if (editorRef.current && document.activeElement !== editorRef.current) {
                          editorRef.current.focus();
                        }
                      }}
                    >
                      {rawText.length === 0 && (
                        <div className="absolute top-4 left-4 right-4 pointer-events-none text-sm text-gray-400 select-none leading-relaxed">
                          <p>लिखिए अपने दिल के अल्फ़ाज़...</p>
                          <p>Write your Shayari here...</p>
                          <p className="text-xs text-gray-400/80 mt-1">Select text or type, then use Header, Bold, Italic, or Underline above.</p>
                        </div>
                      )}

                      <div
                        ref={editorRef}
                        contentEditable
                        role="textbox"
                        aria-multiline="true"
                        aria-label="Write your Shayari here"
                        onInput={syncState}
                        onKeyUp={syncState}
                        onMouseUp={syncState}
                        onSelect={syncState}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        className="p-4 text-sm text-zinc-800 leading-relaxed outline-none min-h-[160px] whitespace-pre-wrap break-words [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-1.5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-1.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-1.5 [&_h]:text-lg [&_h]:font-bold [&_h]:my-1.5"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Highlight any words or lines to style them directly with <strong>Header</strong>, <strong>Bold</strong>, <em>Italic</em>, or <u>Underline</u>.
                  </p>
                </div>

                {/* Optional Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                    Artwork / Photo <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>

                  {optimizing ? (
                    <div className="border border-sky-200 bg-sky-50/60 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                      <p className="text-xs font-semibold text-sky-800">
                        {optimizingStatus || "Optimizing image..."}
                      </p>
                      <p className="text-[11px] text-sky-600">
                        Applying adaptive compression for optimal display...
                      </p>
                    </div>
                  ) : previewUrl ? (
                    <div className="relative border-2 border-gray-200 rounded-xl p-3 bg-gray-50 overflow-hidden flex flex-col items-center">
                      <div className="relative max-h-72 w-full flex items-center justify-center overflow-hidden rounded-lg bg-zinc-900/5">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                        />
                      </div>

                      {optimizedResult && (
                        <div className="w-full mt-3 px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">
                              Original: <strong className="text-zinc-700 font-semibold">{formatFileSize(optimizedResult.originalSize)}</strong>
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-emerald-700 font-semibold">
                              Optimized: <strong className="font-bold">{formatFileSize(optimizedResult.optimizedSize)}</strong>
                              {optimizedResult.savedPercentage > 0 && (
                                <span className="ml-1 text-[11px] text-emerald-600 font-normal">
                                  (-{optimizedResult.savedPercentage}%)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Image optimized successfully</span>
                          </div>
                        </div>
                      )}

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
                      onClick={() => !optimizing && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-sky-400 hover:bg-sky-50/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-sky-100 flex items-center justify-center text-gray-500 group-hover:text-sky-600 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-700">
                          Click to upload an image
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                          Maximum image size: 1 MB • Image will be optimized before upload
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Supports PNG, JPG, or WEBP
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
                    disabled={submitting || optimizing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : optimizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Optimizing Image...</span>
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
