"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import supabase from "../../config/supabase";
import { User, Mail, Instagram, Image as ImageIcon, Save, ArrowLeft, CheckCircle2, AlertCircle, Loader2, History } from "lucide-react";
import Footer from "@/app/components/reuseable/reusable-home/Footer";
import { syncUserProfile, getAvatarFromUser, getNameFromUser } from "@/utils/profile";
import {motion , AnimatePresence} from 'framer-motion'
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
  <div
    className={`${inter.className} min-h-screen bg-white text-[#302b25] relative overflow-hidden`}
  >
    {/* =========================================================
        BACKGROUND LITERARY DECORATIONS
    ========================================================= */}

    {/* Paper texture / soft glow */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="
          absolute
          -top-32
          -right-32
          w-[420px]
          h-[420px]
          rounded-full
          bg-[#e7ddd1]/40
          blur-3xl
        "
      />

      <div
        className="
          absolute
          -bottom-40
          -left-40
          w-[480px]
          h-[480px]
          rounded-full
          bg-[#dfe8ed]/35
          blur-3xl
        "
      />

      {/* Floating tiny paper dots */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          top-36
          left-[8%]
          w-2
          h-2
          rounded-full
          bg-[#b99b79]/30
        "
      />

      <motion.div
        animate={{
          y: [0, 15, 0],
          rotate: [0, -8, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          top-[55%]
          right-[10%]
          w-3
          h-3
          rounded-full
          bg-[#1d5f9b]/15
        "
      />

      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-32
          left-[18%]
          w-1.5
          h-1.5
          rounded-full
          bg-[#a87552]/30
        "
      />
    </div>

    {/* =========================================================
        MAIN
    ========================================================= */}

    <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">

      {/* =======================================================
          PAGE INTRO
      ======================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
        }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-10 bg-[#1d5f9b]" />

          <span
            className="
              text-[10px]
              uppercase
              tracking-[0.28em]
              text-[#8e8175]
              font-medium
            "
          >
            EMERGE · YCCE
          </span>
        </div>

        <h1
          className="
            text-3xl
            sm:text-4xl
            font-semibold
            text-[#302b25]
            tracking-tight
          "
        >
          Your Literary Space
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-[#8d8176]
            max-w-xl
            leading-relaxed
          "
        >
          Shape the identity behind your words, stories,
          shers and shayari.
        </p>
      </motion.div>

      {/* =======================================================
          MAIN PAPER
      ======================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.65,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          relative
          bg-[#fbf9f5]
          border
          border-[#e4dbd1]
          rounded-[28px]
          shadow-[0_25px_70px_rgba(55,43,31,0.10)]
          overflow-hidden
        "
      >

        {/* =====================================================
            DECORATIVE PAPER CORNER
        ===================================================== */}

        <div
          className="
            absolute
            top-0
            right-0
            w-40
            h-40
            bg-[#e8ded3]/50
            rounded-bl-[100%]
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-0
            w-48
            h-32
            bg-[#e5edf0]/40
            rounded-tr-[100%]
            pointer-events-none
          "
        />

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          className="
            relative
            px-6
            sm:px-10
            pt-7
            sm:pt-9
            pb-6
            border-b
            border-[#e8dfd7]
          "
        >
          <div className="flex items-center justify-between gap-4">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#a27b53] text-lg">
                  ❝
                </span>

                <span
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.22em]
                    text-[#a09285]
                  "
                >
                  Literary Identity
                </span>
              </div>

              <h2
                className="
                  text-xl
                  sm:text-2xl
                  font-semibold
                  text-[#302b25]
                "
              >
                Profile Settings
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  sm:text-sm
                  text-[#93877c]
                "
              >
                Tell the club who stands behind the words.
              </p>
            </div>

            {/* Activity button */}

            <Link href="/profile/history">
              <motion.div
                whileHover={{
                  y: -2,
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-full
                  bg-[#e8eef2]
                  border
                  border-[#d7e1e7]
                  text-[#1d5f9b]
                  text-xs
                  font-medium
                  cursor-pointer
                  shadow-sm
                "
              >
                <History className="w-3.5 h-3.5" />

                <span>
                  Your Activity
                </span>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div
          className="
            relative
            grid
            lg:grid-cols-[330px_1fr]
          "
        >

          {/* ===================================================
              LEFT PROFILE CARD
          =================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            className="
              relative
              px-6
              sm:px-10
              py-8
              lg:border-r
              border-[#e8dfd7]
              flex
              flex-col
              items-center
              justify-center
            "
          >

            {/* Tape */}

            <motion.div
              animate={{
                rotate: [-4, -2, -4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute
                top-7
                right-10
                w-20
                h-6
                bg-[#d5b47f]/45
                rotate-[-4deg]
                shadow-sm
              "
            />

            {/* Avatar */}

            <motion.div
              whileHover={{
                scale: 1.035,
                rotate: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
              className="
                relative
                w-36
                h-36
                sm:w-40
                sm:h-40
                rounded-[24px]
                overflow-hidden
                border
                border-[#d6cbc0]
                bg-[#e6e0d9]
                shadow-[0_12px_30px_rgba(55,43,31,0.12)]
              "
            >
              {photoUrl && !imageError ? (
                <Image
                  src={photoUrl}
                  alt="Profile Avatar"
                  width={160}
                  height={160}
                  unoptimized
                  className="
                    w-full
                    h-full
                    object-cover
                  "
                  onError={() =>
                    setImageError(true)
                  }
                  onLoad={() =>
                    setImageError(false)
                  }
                />
              ) : (
                <div
                  className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    bg-[#e8e2da]
                  "
                >
                  <User
                    className="
                      w-14
                      h-14
                      text-[#9b8d80]
                    "
                    strokeWidth={1.3}
                  />
                </div>
              )}

              {/* Image shine */}

              <motion.div
                animate={{
                  x: [
                    "-120%",
                    "140%",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
                className="
                  absolute
                  inset-y-0
                  w-10
                  rotate-[20deg]
                  bg-white/15
                  blur-sm
                  pointer-events-none
                "
              />
            </motion.div>

            {/* Name */}

            <motion.h3
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.35,
              }}
              className="
                mt-6
                text-xl
                font-semibold
                text-[#302b25]
                text-center
              "
            >
              {name || "Club Member"}
            </motion.h3>

            <p
              className="
                mt-1
                text-xs
                text-[#8f8277]
                text-center
                max-w-[240px]
                truncate
              "
            >
              {email}
            </p>

            {/* Quote */}

            <div
              className="
                mt-7
                pt-6
                border-t
                border-[#e7ded5]
                w-full
                text-center
              "
            >
              <motion.div
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="
                  text-[#9b7250]
                  text-2xl
                  leading-none
                "
              >
                ❝
              </motion.div>

              <p
                className="
                  mt-1
                  text-sm
                  italic
                  text-[#665a50]
                  leading-relaxed
                "
              >
                Every profile holds a story.
                <br />
                Every story deserves a voice.
              </p>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                <span className="w-6 h-px bg-[#cbbcac]" />

                <span className="text-[9px] text-[#a49383]">
                  EMERGE
                </span>

                <span className="w-6 h-px bg-[#cbbcac]" />
              </div>
            </div>

            {/* Mobile Activity */}

            <Link
              href="/profile/history"
              className="
                sm:hidden
                mt-6
              "
            >
              <motion.div
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-full
                  bg-[#e8eef2]
                  border
                  border-[#d7e1e7]
                  text-[#1d5f9b]
                  text-xs
                  font-medium
                "
              >
                <History className="w-3.5 h-3.5" />
                Your Activity
              </motion.div>
            </Link>
          </motion.div>

          {/* ===================================================
              RIGHT FORM
          =================================================== */}

          <div
            className="
              px-6
              sm:px-10
              py-8
              sm:py-10
            "
          >

            {/* =================================================
                FEEDBACK
            ================================================= */}

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                  }}
                  className={`
                    mb-6
                    p-3.5
                    rounded-xl
                    flex
                    items-center
                    gap-3
                    text-sm
                    border

                    ${
                      message.type === "success"
                        ? `
                          bg-[#e7f0e9]
                          text-[#4f7058]
                          border-[#d1e1d5]
                        `
                        : `
                          bg-[#f3e4e1]
                          text-[#8d5048]
                          border-[#e7d0cb]
                        `
                    }
                  `}
                >
                  {message.type ===
                  "success" ? (
                    <CheckCircle2
                      className="
                        w-5
                        h-5
                        text-[#638a68]
                        flex-shrink-0
                      "
                    />
                  ) : (
                    <AlertCircle
                      className="
                        w-5
                        h-5
                        text-[#a9584d]
                        flex-shrink-0
                      "
                    />
                  )}

                  <p className="font-medium text-xs">
                    {message.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSave}
              className="space-y-6"
            >

              {/* ===============================================
                  NAME
              =============================================== */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.25,
                }}
              >
                <label
                  htmlFor="name"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    text-[#75695e]
                    uppercase
                    tracking-[0.18em]
                    mb-2
                  "
                >
                  Your Name
                </label>

                <div className="relative group">
                  <div
                    className="
                      absolute
                      inset-y-0
                      left-0
                      pl-4
                      flex
                      items-center
                      pointer-events-none
                    "
                  >
                    <User
                      className="
                        w-4
                        h-4
                        text-[#aaa096]
                        group-focus-within:text-[#1d5f9b]
                        transition-colors
                      "
                    />
                  </div>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your full name"
                    required
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-3

                      bg-[#f7f3ee]

                      border
                      border-[#e1d8cf]

                      rounded-xl

                      text-sm
                      text-[#302b25]

                      placeholder:text-[#aaa096]

                      outline-none

                      focus:bg-white
                      focus:border-[#8caec7]
                      focus:ring-4
                      focus:ring-[#1d5f9b]/5

                      transition-all
                      duration-300
                    "
                  />
                </div>
              </motion.div>

              {/* ===============================================
                  PHOTO URL
              =============================================== */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.32,
                }}
              >
                <label
                  htmlFor="photoUrl"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    text-[#75695e]
                    uppercase
                    tracking-[0.18em]
                    mb-2
                  "
                >
                  Profile Photo
                </label>

                <div className="relative group">
                  <div
                    className="
                      absolute
                      inset-y-0
                      left-0
                      pl-4
                      flex
                      items-center
                      pointer-events-none
                    "
                  >
                    <ImageIcon
                      className="
                        w-4
                        h-4
                        text-[#aaa096]
                        group-focus-within:text-[#1d5f9b]
                        transition-colors
                      "
                    />
                  </div>

                  <input
                    id="photoUrl"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => {
                      setPhotoUrl(
                        e.target.value
                      );
                      setImageError(false);
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-3

                      bg-[#f7f3ee]

                      border
                      border-[#e1d8cf]

                      rounded-xl

                      text-sm
                      text-[#302b25]

                      placeholder:text-[#aaa096]

                      outline-none

                      focus:bg-white
                      focus:border-[#8caec7]
                      focus:ring-4
                      focus:ring-[#1d5f9b]/5

                      transition-all
                      duration-300
                    "
                  />
                </div>

                <p
                  className="
                    text-[10px]
                    text-[#a3988d]
                    mt-2
                  "
                >
                  Use a direct image URL from Google,
                  GitHub, or public hosting.
                </p>
              </motion.div>

              {/* ===============================================
                  INSTAGRAM
              =============================================== */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.39,
                }}
              >
                <label
                  htmlFor="instagram"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    text-[#75695e]
                    uppercase
                    tracking-[0.18em]
                    mb-2
                  "
                >
                  Instagram
                </label>

                <div className="relative group">
                  <div
                    className="
                      absolute
                      inset-y-0
                      left-0
                      pl-4
                      flex
                      items-center
                      pointer-events-none
                    "
                  >
                    <Instagram
                      className="
                        w-4
                        h-4
                        text-[#aaa096]
                        group-focus-within:text-[#8a6755]
                        transition-colors
                      "
                    />
                  </div>

                  <input
                    id="instagram"
                    type="text"
                    value={instagram}
                    onChange={(e) =>
                      setInstagram(
                        e.target.value
                      )
                    }
                    placeholder="@yourusername or https://instagram.com/..."
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-3

                      bg-[#f7f3ee]

                      border
                      border-[#e1d8cf]

                      rounded-xl

                      text-sm
                      text-[#302b25]

                      placeholder:text-[#aaa096]

                      outline-none

                      focus:bg-white
                      focus:border-[#b99a82]
                      focus:ring-4
                      focus:ring-[#a87552]/5

                      transition-all
                      duration-300
                    "
                  />
                </div>
              </motion.div>

              {/* ===============================================
                  EMAIL
              =============================================== */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.46,
                }}
              >
                <label
                  htmlFor="email"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    text-[#9b9086]
                    uppercase
                    tracking-[0.18em]
                    mb-2
                  "
                >
                  Email Address
                </label>

                <div className="relative">
                  <div
                    className="
                      absolute
                      inset-y-0
                      left-0
                      pl-4
                      flex
                      items-center
                      pointer-events-none
                    "
                  >
                    <Mail
                      className="
                        w-4
                        h-4
                        text-[#aaa096]
                      "
                    />
                  </div>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-3

                      bg-[#eeeae5]

                      border
                      border-[#ddd5cd]

                      rounded-xl

                      text-sm
                      text-[#91867c]

                      cursor-not-allowed
                      select-none
                    "
                  />
                </div>

                <p
                  className="
                    text-[10px]
                    text-[#a3988d]
                    mt-2
                  "
                >
                  Connected to your Google sign-in.
                </p>
              </motion.div>

              {/* ===============================================
                  DIVIDER
              =============================================== */}

              <div className="flex items-center gap-4 py-1">
                <span className="h-px flex-1 bg-[#e5ddd5]" />

                <motion.span
                  animate={{
                    rotate: [
                      -3,
                      3,
                      -3,
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="
                    text-[#a17c59]
                    text-xl
                  "
                >
                  ✒
                </motion.span>

                <span className="h-px flex-1 bg-[#e5ddd5]" />
              </div>

              {/* ===============================================
                  SAVE BUTTON
              =============================================== */}

              <div className="flex justify-end pt-1">

                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{
                    y: -2,
                    scale: 1.015,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 20,
                  }}
                  className="
                    relative
                    overflow-hidden

                    inline-flex
                    items-center
                    justify-center
                    gap-2

                    px-6
                    py-3

                    bg-[#1d5f9b]
                    hover:bg-[#174f82]

                    text-white

                    text-xs
                    font-medium

                    rounded-full

                    shadow-[0_7px_20px_rgba(29,95,155,0.20)]

                    transition-colors

                    disabled:opacity-50
                    disabled:cursor-not-allowed

                    cursor-pointer
                  "
                >

                  {/* Button shine */}

                  {!saving && (
                    <motion.span
                      animate={{
                        x: [
                          "-150%",
                          "180%",
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut",
                      }}
                      className="
                        absolute
                        top-0
                        bottom-0
                        w-8
                        rotate-[20deg]
                        bg-white/15
                        blur-sm
                      "
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-2">

                    {saving ? (
                      <>
                        <Loader2
                          className="
                            w-4
                            h-4
                            animate-spin
                          "
                        />

                        <span>
                          Saving...
                        </span>
                      </>
                    ) : (
                      <>
                        <Save
                          className="
                            w-4
                            h-4
                          "
                        />

                        <span>
                          Save Changes
                        </span>
                      </>
                    )}

                  </span>
                </motion.button>
              </div>
            </form>
          </div>
        </div>

        {/* =====================================================
            BOTTOM PAPER FOOTER
        ===================================================== */}

        <div
          className="
            relative
            border-t
            border-[#e8dfd7]
            px-6
            sm:px-10
            py-4
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-2">
            <span
              className="
                w-1.5
                h-1.5
                rounded-full
                bg-[#638a68]
              "
            />

            <span
              className="
                text-[9px]
                uppercase
                tracking-[0.16em]
                text-[#9a8e83]
              "
            >
              Your story belongs here
            </span>
          </div>

          <motion.span
            animate={{
              rotate: [
                -2,
                2,
                -2,
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              text-sm
              text-[#806b56]
              italic
            "
          >
            Keep writing...
          </motion.span>
        </div>
      </motion.div>

      {/* =======================================================
          SMALL SHAYARI FLOATING ELEMENT
      ======================================================= */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 1,
        }}
        className="
          hidden
          lg:block
          fixed
          right-8
          bottom-10
          pointer-events-none
        "
      >
        <motion.div
          animate={{
            y: [0, -7, 0],
            rotate: [
              -2,
              1,
              -2,
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            text-right
            text-[#8d7b6b]
          "
        >
          <div
            className="
              text-2xl
              opacity-40
            "
          >
            ❝
          </div>

          <p
            className="
              text-xs
              italic
              leading-relaxed
            "
          >
            Kuch alfaaz sambhal kar rakhna,
            <br />
            kabhi kahani ban jaate hain.
            kabhi raat ban jati hai.
          </p>

          <div
            className="
              mt-2
              text-[9px]
              tracking-[0.18em]
              text-[#a39484]
            "
          >
            EMERGE
          </div>
        </motion.div>
      </motion.div>
    </main>

    <Footer />
  </div>
);
}