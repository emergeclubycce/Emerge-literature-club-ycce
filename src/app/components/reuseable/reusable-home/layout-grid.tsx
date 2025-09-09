"use client";
import React, { useState, useRef, useEffect } from "react";
import { LayoutGrid } from "../reusable-home/layout";
import { number } from "motion";

export function LayoutGridDemo() {
  return (
    <div className="min-h-screen py-0  w-full">
      <LayoutGrid cards={cards} />
    </div>
  );
}



const cards = [
  {
    id: 1, 
    className: "md:col-span-2",
    thumbnail:
      "/image/event1.JPG",
      number:1,
  },
  {
    id: 2,
  
    className: "col-span-1",
    number:1,
     thumbnail:
      "/image/event4.png",

  },
  {
    id: 3,
 
    className: "col-span-1",
         thumbnail:
      "/image/event5.JPG",

  },
  {
    id: 4,
  
    className: "md:col-span-2",
        number:1,
    thumbnail:
      "/image/event2.JPG",
  },

    {
    id: 5, 
    className: "md:col-span-2",
    thumbnail:
      "/image/event3.png",
      number:1,
  },
  {id:6,
    className: "col-span-1",
  thumbnail:
      "/image/event3.png",
      number:1,
  },


];
