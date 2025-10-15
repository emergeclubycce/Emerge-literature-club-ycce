"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";
import supabase from "@/config/supabase";
import { usePathname } from "next/navigation";


// Define types for user and user metadata
type UserMetadata = {
  picture?: string;
  [key: string]: any;
};

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata: UserMetadata;
  [key: string]: any;
};

type UserImageObj = {
  userImage: string;
  [key: string]: any;
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function Nav() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [menu, setmenu] = useState(false);

   const pathname = usePathname();

  // Whenever the route (path) changes, close the menu
  useEffect(() => {
    setmenu(false);
  }, [pathname]);

  useEffect(() => {
    const userdata = localStorage.getItem("currentuser");
    if (userdata) {
      try {
        const userObj: UserImageObj = JSON.parse(userdata);
        setUserImage(userObj.userImage);
        console.log(userObj.userImage); // store in state
      } catch (err) {
        console.error("Invalid JSON in localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as SupabaseUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser((session?.user as SupabaseUser) || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

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

      {/* Links */}
      <div className=" Sans hidden text-sm md:flex items-center justify-center gap-10 cursor-pointer">
        <Link href={"/"} >
          <h1 className="  before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">
            Home
          </h1>
        </Link>
        <Link href={"/about-us"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">
            About us
          </h2>
        </Link>
        <Link href={"/shers"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">
            Shers
          </h2>
        </Link>
        <Link href={"/event"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">
            Events
          </h2>
        </Link>
        <Link href={"/team"}>
          <h4 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">
            Team
          </h4>
        </Link>
        {user ? (
          <div className=" h-8 w-8 rounded-full bg-red-300 overflow-hidden ">
            <Image
              src={user.user_metadata.picture || ""}
              alt="userImage"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        ) : (
          <Link href={"/auth/login"}>
            <button className="px-5 hover:bg-white hover:text-sky-400 hover:outline-2 cursor-pointer transition-all  py-1 bg-sky-500 rounded text-white">
              Login
            </button>
          </Link>
        )}
      </div>

      <div
        className={` ${
          menu ? " translate-y-0" : " -translate-y-100"
        } transition-all   md:hidden flex flex-col h-96   w-[100%] -ml-3   bg-white absolute top-0 `}
      >
        <div className=" w-full p-5 flex items-center justify-between border-b border-gray-200">
          <div className="h-12 w-12 rounded-full overflow-hidden border-[1px] ">
            <Image src="/image/logo.png" alt="logo" width={100} height={100} />
          </div>

          <div onClick={() => setmenu((prev) => !prev)}>
            <X />
          </div>
        </div>
        <div className="w-full px-3">
          <Link href={"/"}>
            <div className="w-full py-4 text-sm p-3 text-center">
              <h1>Home</h1>
            </div>
          </Link>

          <hr className="text-gray-200" />

          <Link href={"about-us"}>
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
          <Link href={"/team"}>
            <div className="w-full text-sm p-3 text-center">
              <h1>Team</h1>
            </div>
          </Link>
        </div>

        <h1 className="text-center text-[10px] text-gray-500 mt-5">
          @2025 Emerge Literature Club | YCCE
        </h1>
      </div>

      {/* Mobile menu */}
      <div className=" md:hidden block flex items-center justify-center gap-3">
        <Menu onClick={() => setmenu((prev) => !prev)} />
        {user ? (
          <div className=" h-8 w-8 rounded-full bg-red-300 overflow-hidden ">
            <Image
              src={user.user_metadata.picture || ""}
              alt="userImage"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        ) : (
          <Link href={"/auth/login"}>
            <button className="px-2 hover:bg-white hover:text-sky-400 hover:outline-2 cursor-pointer transition-all text-sm  py-1 bg-sky-500 rounded text-white">
              Login
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Nav;
