"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { div } from "motion/react-client";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    const userdata = localStorage.getItem("currentuser");
    if (userdata) {
      try {
        const userObj = JSON.parse(userdata);
        setUserImage(userObj.userImage)
        console.log(userObj.userImage) // store in state
      } catch (err) {
        console.error("Invalid JSON in localStorage:", err);
      }
    }
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
      className={`${inter.className} fixed top-0 flex items-center justify-between px-3 py-2 font-medium z-40 h-15 w-full transition-all duration-300 
      ${  scrolled ? "backdrop-blur-2xl bg-white/60 shadow-md" : "bg-transparent"}`}
    >
      {/* Logo */}
      <div className="h-12 w-12 rounded-full overflow-hidden border-[1px] border-gray-400">
        <Image src="/image/image.png" alt="logo" width={100} height={100} />
      </div>

      {/* Links */}
      <div className=" Sans hidden text-sm md:flex items-center justify-center gap-10 cursor-pointer">
        <Link href={"/"}>
          <h1 className="  before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">Home</h1>
        </Link>
        <Link href={"/about-us"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">About us</h2>
        </Link>
        <Link href={"/shers"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">Shers</h2>
        </Link>
        <Link href={"/event"}>
          <h2 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500" >Events</h2>
       
        </Link>
        <Link href={"/team"}>
          <h4 className="before:content-[''] before:absolute before:bottom-0 relative before:left-0 before:h-0.5 before:w-0 hover:before:w-[120%] before:transition-all  before:bg-blue-500">Team</h4>
        </Link>
        {
         userImage ?
                 <div className=" h-8 w-8 rounded-full bg-red-300 overflow-hidden ">
                      <img src={userImage} alt="" />
                 </div>
          :
        <Link href={"/auth/login"}>
          <button className="px-5 hover:bg-white hover:text-sky-400 hover:outline-2 cursor-pointer transition-all  py-1 bg-sky-500 rounded text-white">
            Login
          </button>
        </Link>
        }
      </div>

      {/* Mobile menu */}
      <div className=" md:hidden block flex items-center justify-center gap-3">
      <Menu/>
      {userImage ?  <div className=" h-8 w-8 rounded-full bg-red-300 overflow-hidden ">
                      <img src={userImage} alt="" />
                 </div> :
                   <Link href={"/auth/login"}>
          <button className="px-2 hover:bg-white hover:text-sky-400 hover:outline-2 cursor-pointer transition-all text-sm  py-1 bg-sky-500 rounded text-white">
            Login
          </button>
        </Link> }

      </div>
    </div>
  );
}

export default Nav;
