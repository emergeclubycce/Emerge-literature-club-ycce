"use client";

import React from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Bookmark, HeartIcon, Send } from "lucide-react";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface SherProp {
  writter: string;
  caption: string;
  image: string;
  idx : number;
}

function SherCard({ writter, caption, image ,idx }: SherProp) {
  

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Poem by ${writter}`,
          text: caption,
          url: `https://emergeycce.club/shers/share/${idx}`,
        });
      } catch (error) {
        console.log("Share cancelled", error);
      }
    }
  };

  return (
    <div className="h-auto border-2 px-2 rounded border-gray-200 w-96 md:w-[27rem]">
      {/* Header */}
      <div className="h-15 w-full p-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-400">
            <Image src="/image/logo.png" alt="logo" width={100} height={100} />
          </div>
          <p className={`${inter.className} font-medium text-sm`}>
            Emerge <span>Literature</span> Club | YCCE.
          </p>
        </div>
        <div className="h-full flex flex-col items-center justify-center gap-[3px]">
          <div className="h-1 w-1 bg-gray-200 rounded-2xl"></div>
          <div className="h-1 w-1 bg-gray-200 rounded-2xl"></div>
          <div className="h-1 w-1 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>

      {/* Image Section */}
      <div className="h-auto w-full border-gray-300 flex items-center justify-center px-4 text-center">
        <img src={image} alt="" className="overflow-hidden rounded-2xl" />
      </div>

      {/* Footer */}
      <div className="h-auto w-full">
        <div className="w-full h-10 p-2 flex items-center justify-between">
          <div className="flex gap-3">
            <HeartIcon className="focus:bg-pink-500" />
            <button onClick={handleShare}>
              <Send />
            </button>
          </div>

          <div className="flex gap-1 -ml-4"></div>

          <Bookmark />
        </div>
        <div className="Inter text-xs px-2 ml-2 w-fit rounded-2xl py-[3px] outline-dashed outline-[0.5px] outline-zinc-600 bg-slate-200">
          Written by {writter}
        </div>
        <div className="text-sm p-2">{caption}</div>
      </div>
    </div>
  );
}

export default SherCard;