"use client";

import { useEffect, useRef, useCallback } from "react";
import Lenis from "@studio-freight/lenis";

type ScrollTarget = number | string | HTMLElement;

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target: ScrollTarget) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target);
    } else if (typeof window !== "undefined") {
      window.scrollTo({
        top: typeof target === "number" ? target : 0,
        behavior: "smooth",
      });
    }
  }, []);

  return scrollTo;
};
