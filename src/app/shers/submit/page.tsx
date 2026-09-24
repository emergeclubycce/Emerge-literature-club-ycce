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
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import {
  hasMeaningfulText,
  serializeEditorHtml,
  sanitizePastedHtml,
} from "@/utils/posts";
import {
  validateImageFile,
  optimizeImageClientSide,
  formatFileSize,
  OptimizedImageResult,
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
  const [isEmpty, setIsEmpty] = useState(true);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [optimizedFile, setOptimizedFile] = useState<File | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizedImageResult | null>(null);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize active formatting styles with the current selection / cursor
  const updateActiveFormats = () => {
    if (typeof document === "undefined" || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) {
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      return;
    }
    // Only query if cursor/selection is inside the editor
    if (!editorRef.current.contains(selection.anchorNode)) {
      return;
    }
    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
    } catch {
      // Browser safety fallback
    }
  };

  // Toggle Bold / Italic / Underline formatting directly in WYSIWYG
  const toggleFormat = (cmd: "bold" | "italic" | "underline") => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false);
    updateActiveFormats();
    handleEditorInput();
  };

  // Keep toolbar active states reactive on selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Sync content state & empty status whenever user types
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const raw = (editorRef.current.innerText || editorRef.current.textContent || "")
      .replace(/\u00a0/g, " ")
      .trim();
    const empty = raw.length === 0;
    setIsEmpty(empty);
    if (error) setError(null);

    const serialized = empty ? "" : serializeEditorHtml(editorRef.current);
    setContent(serialized);
    updateActiveFormats();
  };

  // Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac =
      typeof window !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const isMod = isMac ? e.metaKey : e.ctrlKey;

    if (isMod) {
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

  // Secure paste handler: sanitizes rich text paste to only allowed tags
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    if (html) {
      const clean = sanitizePastedHtml(html);
      if (clean) {
        document.execCommand("insertHTML", false, clean);
        updateActiveFormats();
        handleEditorInput();
        return;
      }
    }
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    updateActiveFormats();
    handleEditorInput();
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

  // Clean up object URL when component unmounts
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file) return;

    // 1. Immediate validation before compression/upload (max 1 MB, supported format)
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid image file.");
      return;
    }

    // 2. Perform frontend adaptive optimization
    setOptimizingImage(true);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      const result = await optimizeImageClientSide(file);
      setOptimizedFile(result.file);
      setOptimizationResult(result);
      setPreviewUrl(result.previewUrl);
    } catch (err: any) {
      console.error("Image optimization error:", err);
      setError(
        err.message || "Failed to optimize image. Please select a different image."
      );
      setOptimizedFile(null);
      setOptimizationResult(null);
      setPreviewUrl(null);
    } finally {
      setOptimizingImage(false);
    }
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setOptimizedFile(null);
    setOptimizationResult(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Prevent submission while image is still optimizing
    if (optimizingImage) {
      setError("Please wait until image optimization completes.");
      return;
    }

    // Direct extraction of serialized content from editor
    let finalContent = "";
    if (editorRef.current) {
      const raw = (editorRef.current.innerText || editorRef.current.textContent || "")
        .replace(/\u00a0/g, " ")
        .trim();
      if (raw.length > 0) {
        finalContent = serializeEditorHtml(editorRef.current);
      }
    }

    if (!finalContent && !optimizedFile) {
      setError("Please write something or upload an image.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let uploadedFilePath: string | null = null;
    let uploadedImageUrl: string | null = null;

    try {
      // 1. Upload optimized image to Supabase Storage if present
      if (optimizedFile) {
        const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        uploadedFilePath = `${user.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(uploadedFilePath, optimizedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: optimizedFile.type,
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
        content: finalContent,
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
      setContent("");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setOptimizedFile(null);
      setOptimizationResult(null);
      setPreviewUrl(null);
      setIsEmpty(true);
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
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setOptimizedFile(null);
                    setOptimizationResult(null);
                    setOptimizingImage(false);
                    setPreviewUrl(null);
                    setSubmitted(false);
                    setIsEmpty(true);
                    setIsBold(false);
                    setIsItalic(false);
                    setIsUnderline(false);
                    if (editorRef.current) {
                      editorRef.current.innerHTML = "";
                    }
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
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
                {/* Content WYSIWYG Editor with Formatting Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="shayari-editor"
                      className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider"
                    >
                      Shayari / Poem Content{" "}
                      <span className="text-gray-400 font-normal lowercase">
                        (optional if image provided)
                      </span>
                    </label>

                    <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                      Visual Rich-Text
                    </span>
                  </div>

                  {/* WYSIWYG Editor Box */}
                  <div className="border border-gray-200 rounded-xl bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all overflow-hidden shadow-xs">
                    {/* Modern Toolbar */}
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-gray-50/90 border-b border-gray-200 select-none"
                      role="toolbar"
                      aria-label="Text formatting"
                    >
                      <div className="flex items-center gap-1.5">
                        {/* Bold */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleFormat("bold");
                          }}
                          title="Bold (Ctrl+B)"
                          aria-label="Bold"
                          aria-pressed={isBold}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            isBold
                              ? "bg-sky-100 text-sky-700 border border-sky-300 font-bold shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-white active:bg-gray-200 border border-transparent"
                          }`}
                        >
                          <Bold className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Italic */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleFormat("italic");
                          }}
                          title="Italic (Ctrl+I)"
                          aria-label="Italic"
                          aria-pressed={isItalic}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            isItalic
                              ? "bg-sky-100 text-sky-700 border border-sky-300 font-bold shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-white active:bg-gray-200 border border-transparent"
                          }`}
                        >
                          <Italic className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Underline */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            toggleFormat("underline");
                          }}
                          title="Underline (Ctrl+U)"
                          aria-label="Underline"
                          aria-pressed={isUnderline}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            isUnderline
                              ? "bg-sky-100 text-sky-700 border border-sky-300 font-bold shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-white active:bg-gray-200 border border-transparent"
                          }`}
                        >
                          <Underline className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="hidden sm:inline">Editor</span>
                        <span className="text-[10px] uppercase font-mono tracking-wider bg-gray-200/60 px-1.5 py-0.5 rounded text-gray-600">
                          WYSIWYG
                        </span>
                      </div>
                    </div>

                    {/* Contenteditable writing area */}
                    <div className="relative min-h-[170px] sm:min-h-[190px] bg-white">
                      {isEmpty && (
                        <div
                          onClick={() => editorRef.current?.focus()}
                          className="absolute top-4 left-4 right-4 pointer-events-none text-sm text-gray-400 leading-relaxed select-none"
                        >
                          लिखिए अपने दिल के अल्फ़ाज़...
                          <br />
                          Write your Shayari here (or upload an image below)...
                        </div>
                      )}

                      <div
                        id="shayari-editor"
                        ref={editorRef}
                        contentEditable
                        role="textbox"
                        aria-multiline="true"
                        aria-label="Shayari / Poem Content"
                        tabIndex={0}
                        onInput={handleEditorInput}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onKeyUp={updateActiveFormats}
                        onMouseUp={updateActiveFormats}
                        onTouchEnd={updateActiveFormats}
                        onFocus={updateActiveFormats}
                        className="min-h-[170px] sm:min-h-[190px] p-4 text-sm text-zinc-800 leading-relaxed outline-none focus:outline-none whitespace-pre-wrap break-words cursor-text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5 px-0.5">
                    <span>
                      Select words and tap{" "}
                      <span className="font-semibold text-zinc-600">B</span>,{" "}
                      <span className="italic text-zinc-600">I</span>, or{" "}
                      <span className="underline text-zinc-600">U</span> to format directly.
                    </span>
                    <span className="hidden sm:inline font-normal">
                      Shortcuts: Ctrl+B, Ctrl+I, Ctrl+U
                    </span>
                  </div>
                </div>

                {/* Optional Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                    Artwork / Photo <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>

                  {optimizingImage ? (
                    /* Loading / Optimization In-Progress State */
                    <div className="border-2 border-dashed border-sky-300 bg-sky-50/50 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2.5 transition-all">
                      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">
                          Optimizing image...
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Compressing in browser for fast loading & crisp quality
                        </p>
                      </div>
                    </div>
                  ) : previewUrl && optimizationResult ? (
                    /* Optimized Preview with Size Breakdown */
                    <div className="relative border-2 border-gray-200 rounded-xl p-3 bg-gray-50 overflow-hidden flex flex-col items-center">
                      <div className="relative max-h-72 w-full flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                        />
                      </div>

                      {/* Compression Summary Card */}
                      <div className="w-full mt-3 bg-white border border-gray-200 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
                          <span
                            className="font-medium text-zinc-800 truncate max-w-[200px] sm:max-w-xs"
                            title={optimizationResult.originalName}
                          >
                            {optimizationResult.originalName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Image optimized</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-zinc-600">
                          <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-semibold tracking-wider">
                              Original size
                            </span>
                            <span className="font-medium text-zinc-700 text-xs">
                              {formatFileSize(optimizationResult.originalSize)}
                            </span>
                          </div>
                          <div className="bg-sky-50/60 rounded-md p-2 border border-sky-100">
                            <span className="text-sky-600 block text-[10px] uppercase font-semibold tracking-wider">
                              Optimized size
                            </span>
                            <span className="font-bold text-sky-700 text-xs">
                              {formatFileSize(optimizationResult.optimizedSize)}
                              {optimizationResult.reductionPercentage > 0 && (
                                <span className="text-[10px] text-emerald-600 font-semibold ml-1.5">
                                  (-{optimizationResult.reductionPercentage}%)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-zinc-700 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Replace Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial Upload Dropzone */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-sky-400 hover:bg-sky-50/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-sky-100 flex items-center justify-center text-gray-500 group-hover:text-sky-600 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-700">
                          Add an image
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          JPG, PNG, WebP • Maximum 1 MB
                        </p>
                        <p className="text-[10px] text-sky-600 font-medium mt-1">
                          Images are automatically optimized before upload.
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
                    disabled={submitting || optimizingImage}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : optimizingImage ? (
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
