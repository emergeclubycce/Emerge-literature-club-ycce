"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Menu,
  X,
  User,
  Shield,
  LogOut,
  History,
} from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";
import supabase from "../../../../config/supabase";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  syncUserProfile,
  UserProfile,
  getAvatarFromUser,
} from "@/utils/profile";

// Define types for user and user metadata
type UserMetadata = {
  picture?: string;
  avatar_url?: string;
  [key: string]: any;
};

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata: UserMetadata;
  [key: string]: any;
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function Nav() {
  const [user, setUser] =
    useState<SupabaseUser | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [isAdmin, setIsAdmin] =
    useState<boolean>(false);

  const [dropdownOpen, setDropdownOpen] =
    useState<boolean>(false);

  const [scrolled, setScrolled] =
    useState<boolean>(false);

  const [menu, setmenu] =
    useState(false);

  const [desktopImgError, setDesktopImgError] =
    useState(false);

  const [mobileImgError, setMobileImgError] =
    useState(false);

  /*
   * Navbar visibility.
   *
   * true  -> navbar visible
   * false -> navbar slides away while scrolling down
   */
  const [navVisible, setNavVisible] =
    useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const desktopDropdownRef =
    useRef<HTMLDivElement>(null);

  const mobileDropdownRef =
    useRef<HTMLDivElement>(null);

  const lastScrollY =
    useRef(0);

  // =========================================================
  // NAVIGATION ITEMS
  // =========================================================

  const navItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About us",
      href: "/about-us",
    },
    {
      label: "Shers",
      href: "/shers",
    },
    {
      label: "Emerge Herald",
      href: "/event",
    },
    {
      label: "Memories",
      href: "/memories",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Add Post",
      href: "/shers/submit",
    },
  ];

  // =========================================================
  // ACTIVE ROUTE
  // =========================================================

  const isActiveRoute = (
    href: string
  ) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  // =========================================================
  // PREFETCH PAGE
  // =========================================================

  const prefetchPage = (
    href: string
  ) => {
    router.prefetch(href);
  };

  // =========================================================
  // Whenever route changes:
  // close menu and dropdown
  // =========================================================

  useEffect(() => {
    setmenu(false);
    setDropdownOpen(false);
  }, [pathname]);

  // =========================================================
  // Initial user fetch & live session listener
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          console.warn(
            "Supabase auth session check notice:",
            error.message
          );

          const isStaleSession =
            error.message
              ?.toLowerCase()
              .includes("refresh token") ||
            error.name ===
            "AuthSessionMissingError" ||
            error.status === 400 ||
            error.status === 401;

          if (isStaleSession) {
            // Safely clear the invalid local session
            // from storage
            supabase.auth
              .signOut({
                scope: "local",
              })
              .catch((e) => {
                console.warn(
                  "Local signOut notice:",
                  e
                );
              });
          }

          setUser(null);
          setIsAdmin(false);
          setProfile(null);

          return;
        }

        setUser(
          (data?.user as SupabaseUser) ||
          null
        );
      })
      .catch((err) => {
        console.warn(
          "Auth getUser exception handled:",
          err
        );

        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
        }
      });

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!isMounted) return;

          if (
            event === "SIGNED_OUT" ||
            !session?.user
          ) {
            setUser(null);
            setIsAdmin(false);
            setProfile(null);
          } else {
            setUser(
              (session.user as SupabaseUser) ||
              null
            );
          }
        }
      );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // Synchronize and load profile
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setProfile(null);
      return;
    }

    syncUserProfile(user)
      .then((p) => {
        if (isMounted && p) {
          setProfile(p);
        }
      })
      .catch((err) => {
        console.warn(
          "Notice syncing profile:",
          err
        );
      });

    return () => {
      isMounted = false;
    };
  }, [user, pathname]);

  // =========================================================
  // Check admin status
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      try {
        const {
          data,
          error,
        } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (!error && data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // =========================================================
  // Compute profile photo URL safely
  // =========================================================

  const oauthCandidate =
    getAvatarFromUser(user);

  const profilePhotoUrl =
    (profile?.photo_url &&
      profile.photo_url.trim().length > 0
      ? profile.photo_url.trim()
      : null) ||
    (typeof user?.user_metadata
      ?.avatar_url === "string" &&
      user.user_metadata.avatar_url.trim()
        .length > 0
      ? user.user_metadata.avatar_url.trim()
      : null) ||
    (typeof user?.user_metadata
      ?.picture === "string" &&
      user.user_metadata.picture.trim()
        .length > 0
      ? user.user_metadata.picture.trim()
      : null) ||
    oauthCandidate ||
    null;

  const hasValidPhoto =
    Boolean(
      profilePhotoUrl &&
      (profilePhotoUrl.startsWith(
        "http://"
      ) ||
        profilePhotoUrl.startsWith(
          "https://"
        ) ||
        profilePhotoUrl.startsWith("/"))
    );

  useEffect(() => {
    setDesktopImgError(false);
    setMobileImgError(false);
  }, [profilePhotoUrl]);

  // =========================================================
  // Close dropdown on outside click
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      const inDesktop =
        desktopDropdownRef.current?.contains(
          target
        );

      const inMobile =
        mobileDropdownRef.current?.contains(
          target
        );

      if (!inDesktop && !inMobile) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // =========================================================
  // SCROLL EFFECT
  //
  // At top:
  //   navbar visible + normal white surface
  //
  // Scroll down:
  //   navbar slides away
  //
  // Scroll up:
  //   navbar comes back
  //
  // When visible after scrolling:
  //   glass morphism
  // =========================================================

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY =
        window.scrollY;

      // Glass state
      setScrolled(
        currentScrollY > 10
      );

      // Always show navbar near top
      if (currentScrollY <= 30) {
        setNavVisible(true);
        lastScrollY.current =
          currentScrollY;

        return;
      }

      // Scrolling DOWN
      if (
        currentScrollY >
        lastScrollY.current + 5
      ) {
        setNavVisible(false);
      }

      // Scrolling UP
      else if (
        currentScrollY <
        lastScrollY.current - 5
      ) {
        setNavVisible(true);
      }

      lastScrollY.current =
        currentScrollY;
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(
        "Logout failed:",
        err
      );
    } finally {
      setUser(null);
      setIsAdmin(false);
      setProfile(null);
      setDropdownOpen(false);
      setmenu(false);

      router.push("/");
    }
  };

  // =========================================================
  // USER MENU
  //
  // Logic kept the same.
  // Only visual design changed.
  // =========================================================

  const renderUserMenu = () => (
    <motion.div
      initial={{
        opacity: 0,
        y: -8,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -8,
        scale: 0.96,
      }}
      transition={{
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        absolute
        right-0
        mt-3
        w-56
        overflow-hidden
        rounded-[18px]
        border
        border-[#e4ddd5]
        bg-[#faf8f4]/95
        backdrop-blur-xl
        shadow-[0_18px_45px_rgba(45,35,25,0.16)]
        z-50
        text-sm
      "
    >
      {/* Small top notch */}
      <div
        className="
          absolute
          -top-[6px]
          right-5
          w-3
          h-3
          rotate-45
          bg-[#faf8f4]
          border-l
          border-t
          border-[#e4ddd5]
        "
      />

      <div
        className="
          relative
          px-4
          py-3
          border-b
          border-[#e7dfd7]
        "
      >
        <p
          className="
            text-[9px]
            uppercase
            tracking-[0.16em]
            text-[#9d9287]
            font-medium
          "
        >
          Signed in as
        </p>

        <p
          className="
            mt-1
            text-xs
            font-semibold
            text-[#332d27]
            truncate
          "
        >
          {user?.email}
        </p>
      </div>

      {/* Profile */}
      <Link
        href="/profile"
        onClick={() => {
          setDropdownOpen(false);
          setmenu(false);
        }}
        className="
          group
          flex
          items-center
          gap-3
          px-4
          py-3
          text-[#403830]
          hover:bg-[#eee7df]
          transition-colors
          cursor-pointer
        "
      >
        <span
          className="
            flex
            items-center
            justify-center
            w-8
            h-8
            rounded-full
            bg-[#e6dfd7]
            text-[#5d5349]
            group-hover:bg-[#dce7ef]
            group-hover:text-[#1d5f9b]
            transition-all
          "
        >
          <User
            size={15}
            strokeWidth={1.7}
          />
        </span>

        <span className="flex-1">
          <span
            className="
              block
              text-xs
              font-semibold
            "
          >
            Profile
          </span>

          <span
            className="
              block
              text-[9px]
              text-[#9a8e82]
              mt-0.5
            "
          >
            Your literary identity
          </span>
        </span>

        <span
          className="
            text-[#aaa096]
            group-hover:text-[#1d5f9b]
            group-hover:translate-x-1
            transition-all
          "
        >
          →
        </span>
      </Link>

      {/* Activity */}
      <Link
        href="/profile/history"
        onClick={() => {
          setDropdownOpen(false);
          setmenu(false);
        }}
        className="
          group
          flex
          items-center
          gap-3
          px-4
          py-3
          text-[#403830]
          hover:bg-[#eee7df]
          transition-colors
          cursor-pointer
        "
      >
        <span
          className="
            flex
            items-center
            justify-center
            w-8
            h-8
            rounded-full
            bg-[#e8dfd3]
            text-[#806746]
            group-hover:bg-[#e2d5c5]
            group-hover:text-[#76562e]
            transition-all
          "
        >
          <History
            size={15}
            strokeWidth={1.7}
          />
        </span>

        <span className="flex-1">
          <span
            className="
              block
              text-xs
              font-semibold
            "
          >
            Your Activity
          </span>

          <span
            className="
              block
              text-[9px]
              text-[#9a8e82]
              mt-0.5
            "
          >
            Your journey with words
          </span>
        </span>

        <span
          className="
            text-[#aaa096]
            group-hover:text-[#806746]
            group-hover:translate-x-1
            transition-all
          "
        >
          →
        </span>
      </Link>

      {/* Admin */}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => {
            setDropdownOpen(false);
            setmenu(false);
          }}
          className="
            group
            flex
            items-center
            gap-3
            px-4
            py-3
            text-[#55472f]
            hover:bg-[#eee5d7]
            transition-colors
            cursor-pointer
          "
        >
          <span
            className="
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-full
              bg-[#e7d9bd]
              text-[#96702f]
              group-hover:bg-[#dfcfaf]
              transition-all
            "
          >
            <Shield
              size={15}
              strokeWidth={1.7}
            />
          </span>

          <span className="flex-1">
            <span
              className="
                block
                text-xs
                font-semibold
              "
            >
              Admin Dashboard
            </span>

            <span
              className="
                block
                text-[9px]
                text-[#9a8e82]
                mt-0.5
              "
            >
              Manage the club
            </span>
          </span>

          <span
            className="
              text-[#aa997f]
              group-hover:text-[#96702f]
              group-hover:translate-x-1
              transition-all
            "
          >
            →
          </span>
        </Link>
      )}

      <div
        className="
          h-px
          bg-[#e4ddd5]
          mx-3
        "
      />

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="
          group
          w-full
          flex
          items-center
          gap-3
          px-4
          py-3
          text-left
          text-[#8d5047]
          hover:bg-[#f1e1dd]
          transition-colors
          cursor-pointer
        "
      >
        <span
          className="
            flex
            items-center
            justify-center
            w-8
            h-8
            rounded-full
            bg-[#edd9d4]
            text-[#a64e42]
            group-hover:bg-[#e9cbc5]
            transition-all
          "
        >
          <LogOut
            size={15}
            strokeWidth={1.7}
          />
        </span>

        <span className="flex-1">
          <span
            className="
              block
              text-xs
              font-semibold
            "
          >
            Logout
          </span>

          <span
            className="
              block
              text-[9px]
              text-[#a88983]
              mt-0.5
            "
          >
            Leave your session
          </span>
        </span>

        <span
          className="
            text-[#c08076]
            group-hover:text-[#a64e42]
            group-hover:translate-x-1
            transition-all
          "
        >
          →
        </span>
      </button>
    </motion.div>
  );

  // =========================================================
  // NAVBAR
  // =========================================================

  return (
    <>
      {/* =====================================================
          DESKTOP NAVBAR
      ===================================================== */}

      <AnimatePresence>
        {navVisible && (
          <motion.div
            initial={{
              y: -100,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -100,
              opacity: 0,
            }}
            transition={{
              duration: 0.45,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="
              fixed
              top-3
              left-0
              right-0
              z-50
              hidden
              md:flex
              justify-center
              pointer-events-none
              px-4
            "
          >
            <div
              className={`
                ${inter.className}

                relative
                pointer-events-auto

                flex
                items-center

                h-[62px]

                rounded-[22px]

                border

                transition-all
                duration-500

                ${scrolled
                  ? `
                      bg-white/60
                      backdrop-blur-2xl
                      border-white/80
                      shadow-[0_14px_45px_rgba(45,35,25,0.14)]
                    `
                  : `
                      bg-white
                      border-[#eee8e1]
                      shadow-[0_10px_32px_rgba(45,35,25,0.10)]
                    `
                }
              `}
            >
              {/* =================================================
                  LOGO
              ================================================= */}

              <Link
                href="/"
                className="
                  flex
                  items-center
                  justify-center
                  px-3
                  h-full
                  shrink-0
                "
              >
                <motion.div
                  whileHover={{
                    scale: 1.07,
                    rotate: -3,
                  }}
                  whileTap={{
                    scale: 0.93,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 18,
                  }}
                  className="
                    relative
                    w-11
                    h-11
                    rounded-full
                    overflow-hidden
                    border
                    border-[#b8aea4]
                    bg-white
                    shadow-[0_3px_12px_rgba(40,32,25,0.12)]
                    cursor-pointer
                  "
                >
                  <Image
                    src="/image/logo.png"
                    alt="EMERGE"
                    width={100}
                    height={100}
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />

                  {/* subtle rotating ring */}
                  <motion.span
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="
                      absolute
                      inset-[-3px]
                      rounded-full
                      border
                      border-[#1d5f9b]/20
                      pointer-events-none
                    "
                  />
                </motion.div>
              </Link>

              {/* =================================================
                  DESKTOP LINKS
              ================================================= */}

              <nav
                className="
                  flex
                  items-center
                  h-full
                  gap-1
                  px-2
                "
              >
                {navItems.map(
                  (item) => {
                    const active =
                      isActiveRoute(
                        item.href
                      );

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        prefetch={true}
                        onMouseEnter={() =>
                          prefetchPage(
                            item.href
                          )
                        }
                        className="
                          relative
                          group
                          h-[46px]
                          flex
                          items-center
                          px-4
                          rounded-[15px]
                          overflow-hidden
                        "
                      >
                        {/* =================================================
                            ACTIVE BACKGROUND
                        ================================================= */}

                        {active && (
                          <motion.div
                            layoutId="activeNavPill"
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 35,
                            }}
                            className="
                              absolute
                              inset-0
                              rounded-[15px]
                              bg-[#eee8e1]
                              border
                              border-[#dfd5cc]
                              shadow-[0_3px_10px_rgba(45,35,25,0.06)]
                            "
                          />
                        )}

                        {/* =================================================
                            HOVER BACKGROUND
                        ================================================= */}

                        {!active && (
                          <span
                            className="
                              absolute
                              inset-0
                              rounded-[15px]
                              bg-[#f4efe9]
                              opacity-0
                              group-hover:opacity-100
                              transition-opacity
                              duration-200
                            "
                          />
                        )}

                        {/* =================================================
                            LINK TEXT
                        ================================================= */}

                        <motion.span
                          whileHover={{
                            y: -1,
                          }}
                          className={`
                            relative
                            z-10
                            text-[13px]
                            tracking-wide
                            whitespace-nowrap
                            transition-colors
                            duration-200

                            ${active
                              ? `
                                  text-[#1d5f9b]
                                  font-semibold
                                `
                              : `
                                  text-[#302b25]
                                  group-hover:text-[#1d5f9b]
                                `
                            }
                          `}
                        >
                          {
                            item.label
                          }
                        </motion.span>

                        {/* =================================================
                            ACTIVE DOT
                        ================================================= */}

                        {active && (
                          <motion.span
                            layoutId="activeNavDot"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 30,
                            }}
                            className="
                              absolute
                              bottom-[5px]
                              left-1/2
                              -translate-x-1/2
                              w-[4px]
                              h-[4px]
                              rounded-full
                              bg-[#b38a5a]
                            "
                          />
                        )}

                        {/* =================================================
                            HOVER UNDERLINE
                        ================================================= */}

                        {!active && (
                          <span
                            className="
                              absolute
                              bottom-[7px]
                              left-1/2
                              -translate-x-1/2
                              w-0
                              h-[1px]
                              bg-[#1d5f9b]
                              group-hover:w-[45%]
                              transition-all
                              duration-300
                            "
                          />
                        )}
                      </Link>
                    );
                  }
                )}
              </nav>

              {/* =================================================
                  USER / LOGIN NOTCH
              ================================================= */}

              <div
                className="
                  relative
                  h-full
                  flex
                  items-center
                  ml-2
                  pl-3
                  pr-2
                "
              >
                {/* =================================================
                    NOTCH
                ================================================= */}

                <div
                  className="
                    absolute
                    -bottom-[1px]
                    left-1/2
                    -translate-x-1/2
                    w-[42px]
                    h-[16px]
                    bg-white
                    border-b
                    border-[#eee8e1]
                    rounded-b-[18px]
                    z-0
                  "
                />

                {/* notch inner cut */}
                <div
                  className="
                    absolute
                    -bottom-[1px]
                    left-1/2
                    -translate-x-1/2
                    w-[26px]
                    h-[11px]
                    bg-[#faf8f4]
                    rounded-t-[50%]
                    z-[1]
                    opacity-0
                  "
                />

                {user ? (
                  <div
                    className="
                      relative
                      z-10
                    "
                    ref={
                      desktopDropdownRef
                    }
                  >
                    {/* =================================================
                        PROFILE BUTTON
                    ================================================= */}

                    <motion.button
                      type="button"
                      onClick={() =>
                        setDropdownOpen(
                          (prev) =>
                            !prev
                        )
                      }
                      whileHover={{
                        scale: 1.08,
                      }}
                      whileTap={{
                        scale: 0.92,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 18,
                      }}
                      className="
                        relative
                        w-11
                        h-11
                        rounded-full
                        overflow-hidden
                        border-[1.5px]
                        border-[#9e9288]
                        bg-[#eee8e1]
                        shadow-[0_4px_15px_rgba(40,32,25,0.14)]
                        hover:border-[#1d5f9b]
                        hover:shadow-[0_5px_20px_rgba(29,95,155,0.20)]
                        focus:outline-none
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        transition-all
                        duration-300
                      "
                      aria-label="User menu"
                    >
                      {hasValidPhoto &&
                        !desktopImgError ? (
                        <Image
                          src={
                            profilePhotoUrl!
                          }
                          alt={
                            profile?.name ||
                            user.email ||
                            "User"
                          }
                          width={44}
                          height={44}
                          unoptimized
                          onError={() =>
                            setDesktopImgError(
                              true
                            )
                          }
                          className="
                            object-cover
                            w-full
                            h-full
                          "
                        />
                      ) : (
                        <User
                          size={19}
                          strokeWidth={
                            1.6
                          }
                          className="
                            text-[#51483f]
                          "
                        />
                      )}

                      {/* =================================================
                          ONLINE INDICATOR
                      ================================================= */}

                      <motion.span
                        animate={{
                          scale: [
                            1,
                            1.3,
                            1,
                          ],
                          opacity: [
                            1,
                            0.7,
                            1,
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className="
                          absolute
                          bottom-0
                          right-0
                          w-3
                          h-3
                          rounded-full
                          bg-[#638a68]
                          border-2
                          border-white
                        "
                      />
                    </motion.button>

                    {dropdownOpen &&
                      renderUserMenu()}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    prefetch={true}
                    onMouseEnter={() =>
                      prefetchPage(
                        "/auth/login"
                      )
                    }
                  >
                    <motion.button
                      whileHover={{
                        scale: 1.04,
                        y: -2,
                      }}
                      whileTap={{
                        scale: 0.95,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 18,
                      }}
                      className="
                        relative
                        overflow-hidden
                        px-5
                        py-2
                        rounded-full
                        bg-[#1d5f9b]
                        text-white
                        text-xs
                        shadow-[0_5px_18px_rgba(29,95,155,0.22)]
                        cursor-pointer
                      "
                    >
                      {/* shimmer */}
                      <motion.span
                        animate={{
                          x: [
                            "-130%",
                            "180%",
                          ],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat:
                            Infinity,
                          repeatDelay: 1.8,
                          ease: "easeInOut",
                        }}
                        className="
                          absolute
                          top-0
                          left-0
                          h-full
                          w-7
                          rotate-[20deg]
                          bg-white/20
                          blur-sm
                        "
                      />

                      <span
                        className="
                          relative
                          z-10
                        "
                      >
                        Login
                      </span>
                    </motion.button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MOBILE NAVBAR
      ========================================================= */}

      <AnimatePresence>
        {navVisible && (
          <motion.div
            initial={{
              y: -80,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -80,
              opacity: 0,
            }}
            transition={{
              duration: 0.4,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className={`
              ${inter.className}

              md:hidden

              fixed
              top-3
              left-3
              right-3

              z-50

              h-[58px]

              px-3

              rounded-[18px]

              flex
              items-center
              justify-between

              border

              transition-all
              duration-500

              ${scrolled
                ? `
                    bg-white/65
                    backdrop-blur-2xl
                    border-white/80
                    shadow-[0_12px_35px_rgba(45,35,25,0.14)]
                  `
                : `
                    bg-white
                    border-[#eee8e1]
                    shadow-[0_8px_25px_rgba(45,35,25,0.10)]
                  `
              }
            `}
          >
            {/* Mobile logo */}

            <Link href="/">
              <motion.div
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                className="
                  relative
                  w-10
                  h-10
                  rounded-full
                  overflow-hidden
                  border
                  border-[#b8aea4]
                  bg-white
                  shadow-sm
                "
              >
                <Image
                  src="/image/logo.png"
                  alt="EMERGE"
                  width={80}
                  height={80}
                  className="
                    w-full
                    h-full
                    object-cover
                  "
                />
              </motion.div>
            </Link>

            {/* Mobile right */}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              {/* Menu */}

              <motion.button
                whileHover={{
                  scale: 1.06,
                }}
                whileTap={{
                  scale: 0.88,
                }}
                onClick={() =>
                  setmenu(
                    (prev) => !prev
                  )
                }
                className="
                  w-10
                  h-10
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-[#302b25]
                  hover:bg-[#eee7df]
                  transition-colors
                  cursor-pointer
                "
              >
                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  {menu ? (
                    <motion.span
                      key="close"
                      initial={{
                        opacity: 0,
                        rotate: -90,
                        scale: 0.7,
                      }}
                      animate={{
                        opacity: 1,
                        rotate: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        rotate: 90,
                        scale: 0.7,
                      }}
                    >
                      <X
                        size={21}
                      />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{
                        opacity: 0,
                        rotate: 90,
                        scale: 0.7,
                      }}
                      animate={{
                        opacity: 1,
                        rotate: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        rotate: -90,
                        scale: 0.7,
                      }}
                    >
                      <Menu
                        size={21}
                      />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Mobile profile */}

              {user ? (
                <div
                  className="relative"
                  ref={
                    mobileDropdownRef
                  }
                >
                  <motion.button
                    type="button"
                    onClick={() =>
                      setDropdownOpen(
                        (prev) =>
                          !prev
                      )
                    }
                    whileHover={{
                      scale: 1.07,
                    }}
                    whileTap={{
                      scale: 0.9,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 18,
                    }}
                    className="
                      relative
                      w-9
                      h-9
                      rounded-full
                      overflow-hidden
                      border
                      border-[#aaa097]
                      bg-[#eee7df]
                      hover:border-[#1d5f9b]
                      hover:ring-2
                      hover:ring-[#1d5f9b]/15
                      flex
                      items-center
                      justify-center
                      cursor-pointer
                      transition-all
                    "
                    aria-label="User menu"
                  >
                    {hasValidPhoto &&
                      !mobileImgError ? (
                      <Image
                        src={
                          profilePhotoUrl!
                        }
                        alt={
                          profile?.name ||
                          user.email ||
                          "User"
                        }
                        width={36}
                        height={36}
                        unoptimized
                        onError={() =>
                          setMobileImgError(
                            true
                          )
                        }
                        className="
                          object-cover
                          w-full
                          h-full
                        "
                      />
                    ) : (
                      <User
                        size={16}
                        className="
                          text-[#51483f]
                        "
                      />
                    )}

                    <motion.span
                      animate={{
                        scale: [
                          1,
                          1.3,
                          1,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="
                        absolute
                        bottom-0
                        right-0
                        w-2.5
                        h-2.5
                        rounded-full
                        bg-[#638a68]
                        border-2
                        border-white
                      "
                    />
                  </motion.button>

                  {dropdownOpen &&
                    renderUserMenu()}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  prefetch={true}
                  onMouseEnter={() =>
                    prefetchPage(
                      "/auth/login"
                    )
                  }
                >
                  <motion.button
                    whileHover={{
                      y: -2,
                      scale: 1.04,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    className="
                      px-4
                      py-2
                      rounded-full
                      bg-[#1d5f9b]
                      text-white
                      text-xs
                      shadow-md
                      cursor-pointer
                    "
                  >
                    Login
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MOBILE DRAWER
      ========================================================= */}

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{
              opacity: 0,
              y: -25,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -25,
              scale: 0.98,
            }}
            transition={{
              duration: 0.4,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="
              md:hidden
              fixed
              top-[73px]
              left-3
              right-3
              z-40

              max-h-[calc(100vh-90px)]
              overflow-y-auto

              rounded-[20px]

              bg-[#faf8f4]

              border
              border-[#e3dad0]

              shadow-[0_20px_50px_rgba(45,35,25,0.16)]
            "
          >
            {/* Decorative corner */}

            <div
              className="
                absolute
                top-0
                right-0
                w-24
                h-24
                rounded-bl-full
                bg-[#e2d3c2]/30
                pointer-events-none
              "
            />

            <div
              className="
                relative
                p-3
              "
            >
              {/* Mobile heading */}

              <div
                className="
                  px-4
                  pt-3
                  pb-4
                "
              >
                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.25em]
                    text-[#9d9084]
                  "
                >
                  EMERGE
                </p>

                <p
                  className="
                    mt-1
                    text-[18px]
                    text-[#302b25]
                    font-semibold
                  "
                >
                  The Literature Club
                </p>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mt-3
                  "
                >
                  <span
                    className="
                      w-8
                      h-px
                      bg-[#1d5f9b]
                    "
                  />

                  <span
                    className="
                      text-[8px]
                      tracking-[0.2em]
                      text-[#9d9084]
                    "
                  >
                    YCCE
                  </span>
                </div>
              </div>

              {/* =================================================
                  NAV LINKS
              ================================================= */}

              <div
                className="
                  space-y-1
                "
              >
                {navItems.map(
                  (
                    item,
                    index
                  ) => {
                    const active =
                      isActiveRoute(
                        item.href
                      );

                    return (
                      <motion.div
                        key={
                          item.href
                        }
                        initial={{
                          opacity: 0,
                          x: -18,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.045,
                          duration:
                            0.28,
                        }}
                      >
                        <Link
                          href={
                            item.href
                          }
                          prefetch={
                            true
                          }
                          onMouseEnter={() =>
                            prefetchPage(
                              item.href
                            )
                          }
                        >
                          <motion.div
                            whileHover={{
                              x: 5,
                            }}
                            whileTap={{
                              scale: 0.98,
                            }}
                            className={`
                              relative
                              flex
                              items-center
                              justify-between

                              px-4
                              py-3.5

                              rounded-xl

                              overflow-hidden

                              transition-colors
                              duration-200

                              ${active
                                ? `
                                    bg-[#e9e2da]
                                    text-[#1d5f9b]
                                  `
                                : `
                                    text-[#302b25]
                                    hover:bg-[#eee7df]
                                  `
                              }
                            `}
                          >
                            {/* active left bar */}

                            {active && (
                              <motion.span
                                layoutId="mobileActiveBar"
                                transition={{
                                  type: "spring",
                                  stiffness: 450,
                                  damping: 30,
                                }}
                                className="
                                  absolute
                                  left-0
                                  top-2
                                  bottom-2
                                  w-[3px]
                                  rounded-full
                                  bg-[#1d5f9b]
                                "
                              />
                            )}

                            <span
                              className="
                                relative
                                z-10
                                text-sm
                                font-medium
                              "
                            >
                              {
                                item.label
                              }
                            </span>

                            <motion.span
                              whileHover={{
                                x: 4,
                              }}
                              className={`
                                relative
                                z-10
                                text-base

                                ${active
                                  ? "text-[#1d5f9b]"
                                  : "text-[#aaa096]"
                                }
                              `}
                            >
                              →
                            </motion.span>
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  }
                )}

                {/* =================================================
                    USER SECTION
                ================================================= */}

                {user && (
                  <>
                    <div
                      className="
                        h-px
                        bg-[#ddd3ca]
                        my-3
                      "
                    />

                    {/* Profile */}

                    <motion.div
                      whileHover={{
                        x: 5,
                      }}
                    >
                      <Link href="/profile">
                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            px-4
                            py-3.5
                            rounded-xl
                            text-[#1d5f9b]
                            hover:bg-[#e8eef3]
                            transition-colors
                          "
                        >
                          <span
                            className="
                              text-sm
                              font-medium
                            "
                          >
                            My Profile
                          </span>

                          <span>
                            →
                          </span>
                        </div>
                      </Link>
                    </motion.div>

                    {/* Activity */}

                    <motion.div
                      whileHover={{
                        x: 5,
                      }}
                    >
                      <Link
                        href="/profile/history"
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            px-4
                            py-3.5
                            rounded-xl
                            text-[#1d5f9b]
                            hover:bg-[#e8eef3]
                            transition-colors
                          "
                        >
                          <span
                            className="
                              text-sm
                              font-medium
                            "
                          >
                            Your Activity
                          </span>

                          <span>
                            →
                          </span>
                        </div>
                      </Link>
                    </motion.div>

                    {/* Admin */}

                    {isAdmin && (
                      <motion.div
                        whileHover={{
                          x: 5,
                        }}
                      >
                        <Link href="/admin">
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              px-4
                              py-3.5
                              rounded-xl
                              text-[#80622f]
                              hover:bg-[#eee3d0]
                              transition-colors
                            "
                          >
                            <span
                              className="
                                text-sm
                                font-medium
                              "
                            >
                              Admin Dashboard
                            </span>

                            <span>
                              →
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )}

                    <div
                      className="
                        h-px
                        bg-[#ddd3ca]
                        my-3
                      "
                    />

                    {/* Logout */}

                    <motion.button
                      whileHover={{
                        x: 5,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={
                        handleLogout
                      }
                      className="
                        w-full
                        flex
                        items-center
                        justify-between
                        px-4
                        py-3.5
                        rounded-xl
                        text-left
                        text-[#8a4d42]
                        hover:bg-[#f0e1dd]
                        transition-colors
                        cursor-pointer
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-medium
                        "
                      >
                        Logout
                      </span>

                      <span>
                        →
                      </span>
                    </motion.button>
                  </>
                )}
              </div>

              {/* =================================================
                  MOBILE FOOTER
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  mt-6
                  px-4
                "
              >
                <span
                  className="
                    h-px
                    flex-1
                    bg-[#d7cdc3]
                  "
                />

                <span
                  className="
                    text-[8px]
                    tracking-[0.18em]
                    text-[#9b8d80]
                  "
                >
                  EMERGE
                </span>

                <span
                  className="
                    h-px
                    flex-1
                    bg-[#d7cdc3]
                  "
                />
              </div>

              <p
                className="
                  text-center
                  mt-3
                  mb-2
                  text-[9px]
                  text-[#a29588]
                "
              >
                Literature Club · YCCE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Nav;