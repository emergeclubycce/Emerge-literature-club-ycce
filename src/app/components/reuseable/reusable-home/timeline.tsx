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
    date: "2020",
    title: "Kickoff",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
  },
  {
    date: "2022",
    title: "First Milestone",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
  },
  {
    date: "2023",
    title: "Launch",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
  },
   {
    date: "2024",
    title: "Launch",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
  },
   {
    date: "2025",
    title: "Launch",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
  },
   {
    date: "2026",
    title: "Launch",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
  },
   {
    date: "2027",
    title: "Launch",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga officiis tempora ipsum adipisci tenetur sunt quae exercitationem sed pariatur porro!",
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
        className="relative flex items-start gap-4 group-odd:flex-row-reverse cursor-default group-odd:text-right group-even:order-last"
      >
        <span className="relative size-3 shrink-0 before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:size-2 before:-translate-x-1/2  before:-translate-y-1/2  before:rounded-2xl    before:bg-white rounded-full bg-blue-600"></span>
        <div
        
        className="timeline-wrapper relative -mt-2 ">
        <div    
  className={`timeline-img hidden md:block absolute h-32 w-52 opacity-0 transition-all  scale-0  -top-20 rounded bg-red-200
    ${index % 2 === 0 ? 'left-0' : 'right-0'}`}
></div>
          <time className="text-xs/none font-medium text-gray-700">
            {item.date}
          </time>

          <h3 className={`${inter.className} text-lg font-bold text-gray-900`}>{item.title}</h3>

          <p className={` ${inter.className} mt-0.5 md:w-96 w-40  text-sm text-gray-700`}>{item.description}</p>
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
