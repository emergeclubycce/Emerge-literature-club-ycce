import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import SherCard from "@/app/components/reuseable/reusable-home/sher-card";
import { Inter } from "next/font/google";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import supabase from "@/config/supabase";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { fetchPostEngagement } from "@/utils/engagement";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Slug to image_url mapping for legacy backward compatibility
const LEGACY_SLUG_IMAGE_MAP: Record<string, string> = {
  sathtumare: "/storage/6.png",
  kyauseishwarkhaunga: "/storage/5.png",
  grandstand: "/storage/1.jpg",
  raakh: "/storage/3.png",
  kaal: "/storage/2.png",
  chahat: "/storage/4.png",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  const slugKey = id.toLowerCase().trim();

  let post: any = null;

  if (isNaN(numericId)) {
    const targetImage = LEGACY_SLUG_IMAGE_MAP[slugKey];
    if (targetImage) {
      const { data } = await supabase
        .from("posts")
        .select("id, user_id, author_name, content, image_url, status")
        .eq("image_url", targetImage)
        .eq("status", "approved")
        .maybeSingle();
      post = data;
    }
  } else {
    const { data } = await supabase
      .from("posts")
      .select("id, user_id, author_name, content, image_url, status")
      .eq("id", numericId)
      .eq("status", "approved")
      .maybeSingle();
    post = data;
  }

  if (!post) {
    return {
      title: "Sher Not Found | Emerge Literature Club",
    };
  }

  // Author resolution architecture:
  // 1. public.profiles.name via post.user_id
  // 2. legacy post.author_name fallback
  // 3. fallback "Anonymous"
  let authorName = "Anonymous";
  if (post.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", post.user_id)
      .maybeSingle();
    if (profile?.name?.trim()) {
      authorName = profile.name.trim();
    }
  }

  if (authorName === "Anonymous" && post.author_name?.trim()) {
    authorName = post.author_name.trim();
  }

  const descriptionSnippet = post.content
    ? post.content.replace(/\n/g, " ").slice(0, 150)
    : "Check out this poem on Emerge Literature Club";

  return {
    title: `Sher by ${authorName} | Emerge Literature Club`,
    description: descriptionSnippet,
    openGraph: {
      title: `Poem by ${authorName} | Emerge Literature Club`,
      description: descriptionSnippet,
      images: post.image_url ? [post.image_url] : ["/image/logo.png"],
      url: `https://www.emergeycce.club/shers/share/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Sher by ${authorName}`,
      description: descriptionSnippet,
      images: post.image_url ? [post.image_url] : ["/image/logo.png"],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  const slugKey = id.toLowerCase().trim();

  let post: any = null;

  // Resolve either by legacy slug (mapped to real DB image_url) or by real numeric post ID
  if (isNaN(numericId)) {
    const targetImage = LEGACY_SLUG_IMAGE_MAP[slugKey];
    if (targetImage) {
      const { data } = await supabase
        .from("posts")
        .select("id, user_id, author_name, content, image_url, created_at, status")
        .eq("image_url", targetImage)
        .eq("status", "approved")
        .maybeSingle();
      post = data;
    }
  } else {
    const { data } = await supabase
      .from("posts")
      .select("id, user_id, author_name, content, image_url, created_at, status")
      .eq("id", numericId)
      .eq("status", "approved")
      .maybeSingle();
    post = data;
  }

  if (!post) {
    return renderNotFound();
  }

  // Author resolution architecture:
  // 1. public.profiles.name via post.user_id
  // 2. legacy post.author_name fallback
  // 3. fallback "Anonymous"
  let authorName = "Anonymous";
  let authorPhoto: string | null = null;

  if (post.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, photo_url")
      .eq("user_id", post.user_id)
      .maybeSingle();

    if (profile) {
      if (profile.name?.trim()) authorName = profile.name.trim();
      authorPhoto = profile.photo_url || null;
    }
  }

  if (authorName === "Anonymous" && post.author_name?.trim()) {
    authorName = post.author_name.trim();
  }

  // Pre-fetch engagement counts for server rendering
  let initialLikes = 0;
  let initialBookmarks = 0;
  if (post.id) {
    const engagementMap = await fetchPostEngagement([post.id]);
    if (engagementMap[post.id]) {
      initialLikes = engagementMap[post.id].likes;
      initialBookmarks = engagementMap[post.id].bookmarks;
    }
  }

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 flex flex-col justify-between`}>
      <main className="w-full flex flex-col items-center pt-24 pb-16 px-4">
        <div className="w-full max-w-xl mb-6">
          <Link
            href="/shers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all Shers</span>
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl text-gray-600 font-bold">
            Shared Sher
          </h1>
        </div>

        <SherCard
          id={post.id}
          writter={authorName}
          authorPhoto={authorPhoto}
          image={post.image_url}
          caption={post.content}
          createdAt={post.created_at}
          userId={post.user_id}
          likeCount={initialLikes}
          bookmarkCount={initialBookmarks}
        />
      </main>

      <Footer />
    </div>
  );
}

function renderNotFound() {
  return (
    <div
      className={`${inter.className} min-h-screen bg-gray-50 flex flex-col justify-between`}
    >
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-800 mb-2">
          Sher Not Found
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          This Shayari may not exist, is still pending moderation, or was removed.
        </p>
        <Link
          href="/shers"
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          Explore All Shers
        </Link>
      </main>
      <Footer />
    </div>
  );
}