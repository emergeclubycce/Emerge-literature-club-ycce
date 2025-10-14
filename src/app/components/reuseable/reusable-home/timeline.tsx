"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Inter } from "next/font/google";



const inter = Inter({

   subsets: ["latin"],

  variable: '--font-inter', // should match the font name
});



const timelineData = [
  {
    date: "13 June 2020",
    title: "Formation of Emerge Club",
    description:
      "The foundation day of Emerge marked the beginning of a creative community built to celebrate poetry, literature, and art. It became a platform for budding poets to express emotions, share ideas, and connect through words.",
  },
  {
    date: "11 July 2020",
    title: "Logo Reveal",
    description:
      "Emerge officially unveiled its logo, symbolizing creativity, self-expression, and unity. This visual identity gave the club a strong presence and established its branding for future literary endeavors.",
  },
  {
    date: "10 September 2020",
    title: "Aagaz",
    description:
      "Aagaz marked a new beginning with a creative revival post-pandemic. It introduced fresh talent and initiated a year filled with poetic, cultural, and literary milestones for the club.",
  },
   {
    date: "24 June 2023",
    title: "3rd Anniversary Celebration",
    description:
      "Emerge celebrated three years of poetic excellence. This milestone showcased the club’s journey from its inception to becoming a recognized literary platform nurturing creativity and passion.",
  },
   {
    date: "22 July 2023 ",
    title: "Emerge Day",
    description:
      "A grand annual celebration highlighting members’ achievements, performances, and creative works. It became one of the club’s flagship events, strengthening community spirit and recognition.",
  },
   {
    date: "13 August 2023",
    title: "Antotgatva 4.0",
    description:
      "A powerful open mic event under the Antotgatva series, encouraging writers and performers to share untold stories. The 4th edition saw overwhelming participation and creative diversity.",
  },
   {
    date: "13 Feb 2025",
    title: "Farzi Mushaira",
    description:
      "Farzi Mushaira, conducted under YASH 2K25, was a hugely successful event that significantly increased the popularity of the club.",
  },
   {
    date: "21 Sep 2025",
    title: "Grandstand 5.0",
    description:
      "Marking five years of poetic evolution, Emerge reflected on its inspiring journey, growth, and impact. The day featured performances, reflections, and gratitude toward members who shaped its legacy.",
  }
];
interface TimelineItemType {
  date: string;
  title: string;
  description: string;
}
interface prop{
  item:TimelineItemType,
  index:number
}


function TimelineItem({ item, index }:prop) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <li
      ref={ref}
      className="group relative grid grid-cols-2 odd:-me-3 even:-ms-3"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex md:items-start items-center gap-4  group-odd:flex-row-reverse cursor-default group-odd:text-right group-even:order-last"
      >
        <span className="relative size-3 shrink-0 before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:size-2 before:-translate-x-1/2  before:-translate-y-1/2  before:rounded-2xl    before:bg-white rounded-full bg-blue-600"></span>
        <div
        
        className="timeline-wrapper relative -mt-2 ">
    
          <time className="text-xs/none font-medium text-gray-700">
            {item.date}
          </time>

          <h3 className={`${inter.className} text-lg ${index === 0 && "w-30 md:whitespace-nowrap md:ml-70 ml-30"} font-bold text-gray-900`}>{item.title}</h3>

          <p className={` ${inter.className} mt-0.5  ${index === 0 && "ml-30"} md:w-96 w-32 text-xs  md:text-sm text-gray-700`}>{item.description}</p>
        </div>
      </motion.div>

      <div aria-hidden="true"></div>
    </li>
  );
}

export default function Timeline() {
  return (
    <ol className="relative space-y-8 before:absolute before:top-0 before:left-1/2 before:h-full before:w-0.5 before:-translate-x-1/2 before:rounded-full before:bg-gray-200">
      {timelineData.map((item, index) => (
        <TimelineItem key={index} item={item} index={index} />
      ))}
    </ol>
  );
}
