"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, X, User, Shield, LogOut, History } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";
import supabase from "@/config/supabase";
import { usePathname, useRouter } from "next/navigation";

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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menu, setmenu] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Whenever the route (path) changes, close the menu and dropdown
  useEffect(() => {
    setmenu(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Initial user fetch & live session listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser((data?.user as SupabaseUser) || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser((session?.user as SupabaseUser) || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Check admin status from public.admins whenever user changes
  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
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
        if (isMounted) setIsAdmin(false);
      }
    }

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = desktopDropdownRef.current?.contains(target);
      const inMobile = mobileDropdownRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsAdmin(false);
      setDropdownOpen(false);
      setmenu(false);
      router.push("/");
    }
  };

  const renderUserMenu = () => (
    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 text-sm">
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-[11px] text-gray-400 font-medium">Signed in as</p>
        <p className="text-xs font-semibold text-zinc-700 truncate">{user?.email}</p>
      </div>

      <Link
        href="/profile"
        onClick={() => {
          setDropdownOpen(false);
          setmenu(false);
        }}
        className="flex items-center gap-2.5 px-4 py-2.5 text-zinc-700 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
      >
        <User size={16} className="text-zinc-500" />
        <span className="font-medium text-xs">Profile</span>
      </Link>

      <Link
        href="/profile/history"
        onClick={() => {
          setDropdownOpen(false);
          setmenu(false);
        }}
        className="flex items-center gap-2.5 px-4 py-2.5 text-zinc-700 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
      >
        <History size={16} className="text-zinc-500" />
        <span className="font-medium text-xs">Your Activity</span>
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => {
            setDropdownOpen(false);
            setmenu(false);
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
        >
          <Shield size={16} className="text-amber-500" />
          <span className="font-medium text-xs">Admin Dashboard</span>
        </Link>
      )}

      <div className="border-t border-gray-100 my-1" />

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
      >
        <LogOut size={16} className="text-red-500" />
        <span className="font-medium text-xs">Logout</span>
      </button>
    </div>
  );

  return (
    <div
      className={`${
        inter.className
      } fixed top-0 flex items-center justify-between px-3 py-2 font-medium z-40 h-15 w-full transition-all duration-300 
      ${
        scrolled ? "backdrop-blur-2xl bg-white/60 shadow-md" : "bg-transparent"
      }`}
    >
      {/* Logo */}
      <div className="h-12 w-12 rounded-full overflow-hidden border-[1px] border-gray-400">
        <Image src="/image/logo.png" alt="logo" width={100} height={100} />
      </div>

      {/* Desktop Links */}
      <div className="Sans hidden text-sm md:flex items-center justify-center gap-10 cursor-pointer">
        <Link href={"/"}>
          <h1 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all before:bg-blue-500">
            Home
          </h1>
        </Link>
        <Link href={"/about-us"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all before:bg-blue-500">
            About us
          </h2>
        </Link>
        <Link href={"/shers"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all before:bg-blue-500">
            Shers
          </h2>
        </Link>
        <Link href={"/event"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all before:bg-blue-500">
            Events
          </h2>
        </Link>
        <Link href={"/memories"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all before:bg-blue-500">
            Memories
          </h2>
        </Link>
        <Link href={"/team"}>
          <h4 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all before:bg-blue-500">
            Team
          </h4>
        </Link>

        {user ? (
          <div className="relative" ref={desktopDropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="h-8 w-8 rounded-full bg-zinc-200 overflow-hidden border border-gray-300 hover:ring-2 hover:ring-sky-400 focus:outline-none transition-all flex items-center justify-center cursor-pointer"
              aria-label="User menu"
            >
              {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                <Image
                  src={user.user_metadata?.avatar_url || user.user_metadata?.picture || ""}
                  alt="userImage"
                  width={32}
                  height={32}
                  unoptimized
                  className="object-cover w-full h-full"
                />
              ) : (
                <User size={16} className="text-zinc-600" />
              )}
            </button>
            {dropdownOpen && renderUserMenu()}
          </div>
        ) : (
          <Link href={"/auth/login"}>
            <button className="px-5 hover:bg-white hover:text-sky-400 hover:outline-2 cursor-pointer transition-all py-1 bg-sky-500 rounded text-white">
              Login
            </button>
          </Link>
        )}
      </div>

      {/* Mobile Drawer */}
      <div
        className={`${
          menu ? "translate-y-0" : "-translate-y-full"
        } transition-all duration-300 md:hidden flex flex-col h-auto max-h-[90vh] overflow-y-auto pb-6 w-[100%] -ml-3 bg-white shadow-xl absolute top-0`}
      >
        <div className="w-full p-5 flex items-center justify-between border-b border-gray-200">
          <div className="h-12 w-12 rounded-full overflow-hidden border-[1px]">
            <Image src="/image/logo.png" alt="logo" width={100} height={100} />
          </div>

          <div onClick={() => setmenu((prev) => !prev)} className="cursor-pointer">
            <X />
          </div>
        </div>
        <div className="w-full px-3">
          <Link href={"/"}>
            <div className="w-full py-3 text-sm p-3 text-center">
              <h1>Home</h1>
            </div>
          </Link>

          <hr className="text-gray-200" />

          <Link href={"/about-us"}>
            <div className="w-full text-sm p-3 text-center">
              <h1>About Us</h1>
            </div>
          </Link>
          <hr className="text-gray-200" />

          <Link href={"/shers"}>
            <div className="w-full text-sm p-3 text-center">
              <h1>Shers</h1>
            </div>
          </Link>

          <hr className="text-gray-200" />
          <Link href={"/event"}>
            <div className="w-full text-sm p-3 text-center">
              <h1>Event</h1>
            </div>
          </Link>

          <hr className="text-gray-200" />
          <Link href={"/memories"}>
            <div className="w-full text-sm p-3 text-center">
              <h1>Memories</h1>
            </div>
          </Link>

          <hr className="text-gray-200" />
          <Link href={"/team"}>
            <div className="w-full text-sm p-3 text-center">
              <h1>Team</h1>
            </div>
          </Link>

          {user && (
            <>
              <hr className="text-gray-200" />
              <Link href={"/profile"}>
                <div className="w-full text-sm p-3 text-center text-sky-600 font-medium">
                  <h1>My Profile</h1>
                </div>
              </Link>

              <hr className="text-gray-200" />
              <Link href={"/profile/history"}>
                <div className="w-full text-sm p-3 text-center text-sky-600 font-medium">
                  <h1>Your Activity</h1>
                </div>
              </Link>

              {isAdmin && (
                <>
                  <hr className="text-gray-200" />
                  <Link href={"/admin"}>
                    <div className="w-full text-sm p-3 text-center text-amber-600 font-medium">
                      <h1>Admin Dashboard</h1>
                    </div>
                  </Link>
                </>
              )}

              <hr className="text-gray-200" />
              <div
                onClick={handleLogout}
                className="w-full text-sm p-3 text-center text-red-500 font-medium cursor-pointer"
              >
                <h1>Logout</h1>
              </div>
            </>
          )}
        </div>

        <h1 className="text-center text-[10px] text-gray-500 mt-5">
          @2025 Emerge Literature Club | YCCE
        </h1>
      </div>

      {/* Mobile Top-bar Right Section */}
      <div className="md:hidden flex items-center justify-center gap-3">
        <Menu onClick={() => setmenu((prev) => !prev)} className="cursor-pointer" />
        {user ? (
          <div className="relative" ref={mobileDropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="h-8 w-8 rounded-full bg-zinc-200 overflow-hidden border border-gray-300 hover:ring-2 hover:ring-sky-400 focus:outline-none transition-all flex items-center justify-center cursor-pointer"
              aria-label="User menu"
            >
              {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                <Image
                  src={user.user_metadata?.avatar_url || user.user_metadata?.picture || ""}
                  alt="userImage"
                  width={32}
                  height={32}
                  unoptimized
                  className="object-cover w-full h-full"
                />
              ) : (
                <User size={16} className="text-zinc-600" />
              )}
            </button>
            {dropdownOpen && renderUserMenu()}
          </div>
        ) : (
          <Link href={"/auth/login"}>
            <button className="px-2 hover:bg-white hover:text-sky-400 hover:outline-2 cursor-pointer transition-all text-sm py-1 bg-sky-500 rounded text-white">
              Login
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Nav;
