"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function Nav() {
  const [scrolled, setScrolled] = useState(false);

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
      className={`${inter.className} fixed top-0 flex items-center justify-between px-10 py-2 font-medium z-40 h-15 w-full transition-all duration-300 ${
        scrolled ? "backdrop-blur-2xl bg-white/60 shadow-md" : "bg-transparent"
      }`}
    >
      {/* Logo */}
      <div className="h-12 w-12 rounded-full overflow-hidden border-[1px] border-gray-400">
        <Image src="/image/image.png" alt="logo" width={100} height={100} />
      </div>

      {/* Links */}
      <div className="hidden text-sm md:flex items-center justify-center gap-10 cursor-pointer">
        <Link href={"/"}>
          <h1 className=" before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[140%] before:transition-all  before:bg-blue-500">Home</h1>
        </Link>
        <Link href={"/about-us"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[140%] before:transition-all  before:bg-blue-500">About us</h2>
        </Link>
        <Link href={"/shers"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[140%] before:transition-all  before:bg-blue-500">Shers</h2>
        </Link>
        <Link href={"/event"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[140%] before:transition-all  before:bg-blue-500" >Events</h2>
       
        </Link>
        <Link href={"/team"}>
          <h4 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[140%] before:transition-all  before:bg-blue-500">Team</h4>
        </Link>
        <Link href={"/auth/login"}>
          <button className="px-5 py-1 bg-sky-500 rounded text-white">
            Login
          </button>
        </Link>
      </div>

      {/* Mobile menu */}
      <Menu className="md:hidden block" />
    </div>
  );
}

export default Nav;
