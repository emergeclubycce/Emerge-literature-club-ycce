"use client";
import React, { useEffect, useState } from "react";
import { gsap } from "gsap";

function Loader() {
  const [show, setShow] = useState(false);

  // Reset flag on refresh
  useEffect(() => {
    const handleRefresh = () => {
      sessionStorage.removeItem("loaderPlayed");
    };
    window.addEventListener("beforeunload", handleRefresh);
    return () => window.removeEventListener("beforeunload", handleRefresh);
  }, []);

  // Check session and trigger loader visibility
  useEffect(() => {
    if (!sessionStorage.getItem("loaderPlayed")) {
      setShow(true);
      sessionStorage.setItem("loaderPlayed", "true");
    }
  }, []);

  // Run GSAP animation only after loader is mounted and visible
  useEffect(() => {
    if (show) {
      // Initial states
      gsap.set([".suniyo-1", ".suniyo-2", ".poetry-word"], { opacity: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(".loader", {
            opacity: 0,
            display: "none",
            duration: 1,
            ease: "power2.out",
            onComplete: () => setShow(false),
          });
        },
      });

      // Animation sequence
      tl.to(".suniyo-1", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
      })
        .to(".suniyo-2", {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
        }, "-=0.3")
        .to(".poetry-word", {
          opacity: 1,
          x: 2,
          stagger: 0.4,
          duration: 1.2,
          ease: "power3.out",
        });
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="loader emerge fixed z-50 text-white h-screen w-full flex-col gap-2 bg-sky-600 flex items-center justify-center">
      <div className="flex items-center gap-4">
        <h1 className="suniyo-1 text-2xl opacity-0">Suniye</h1>
        <h1 className="suniyo-2 text-2xl opacity-0">Suniye</h1>
      </div>
      <h1 className="wrap text-[23px] md:text-3xl flex gap-2 md:gap-3">
        <span className="poetry-word opacity-0 inline-block">Arz</span>
        <span className="poetry-word opacity-0 inline-block">Hai,</span>
        <span className="poetry-word opacity-0 inline-block">zara</span>
        <span className="poetry-word opacity-0 inline-block">Gaur</span>
        <span className="poetry-word opacity-0 inline-block">Farmaaiye...</span>
      </h1>
    </div>
  );
}

export default Loader;
