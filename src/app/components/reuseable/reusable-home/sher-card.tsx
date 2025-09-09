"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Bookmark, HeartIcon, Send } from "lucide-react";

const inter = Inter({
   subsets: ["latin"],
  variable: "--font-inter",
});

const shers = [
  "तेरा ज़िक्र जब भी आया, हमने मुस्कुरा कर बात टाल दी, दिल तो रोया... पर चेहरा संभाल लिया।",
  "दिल की बातें दिल में रहीं, जुबां से निकली तो रिश्ता चला गया।",
  "वक़्त ने सिखा दिया हमें ख़ामोश रहना, वरना हर बात पर बवाल होता था।",
];

function SherCard() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % shers.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="h-[37rem] border-2 border-gray-200 w-96 md:w-[27rem]">
      {/* Header */}
      <div className="h-15 w-full p-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-400">
            <Image src="/image/image.png" alt="logo" width={100} height={100} />
          </div>
          <p className={`${inter.className} font-medium text-sm`}>
            Emerge <span>Poetry</span> Club | YCCE.
          </p>
        </div>
        <div className="h-full flex flex-col items-center justify-center gap-[3px]">
          <div className="h-1 w-1 bg-gray-200 rounded-2xl"></div>
          <div className="h-1 w-1 bg-gray-200 rounded-2xl"></div>
          <div className="h-1 w-1 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="h-[23rem] w-full border-t-[1px] border-gray-300 bg-amber-200 border-b-[1px] flex items-center justify-center px-4 text-center">
        <p className={`${inter.className}  text-md font-bold text-zinc-800 px-2 transition-all duration-500 ease-in-out`}>
          {shers[currentIndex]}
        </p>
      </div>

      {/* Footer */}
      <div className="h-36 w-full">
        <div className="w-full h-10 p-2 flex items-center justify-between">
          <div className="flex gap-3">
            <HeartIcon />
            <Send />
          </div>

          <div className="flex gap-1 -ml-4">
            {shers.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-1 rounded-2xl ${
                  i === currentIndex ? "bg-blue-600" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>

          <Bookmark />
        </div>

        <div className="text-sm p-2">
          A sher is more than just poetry — it’s emotion wrapped in two lines.
          From silent heartbreaks to unspoken love, every sher speaks what words
          often can't.
          <br />
          <span className="italic text-gray-700">
            "कुछ अल्फ़ाज़ नहीं कहे जाते, बस शेर बन जाते हैं..."
          </span>
        </div>
      </div>
    </div>
  );
}

export default SherCard;
