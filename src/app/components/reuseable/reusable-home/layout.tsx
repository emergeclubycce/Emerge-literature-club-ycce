"use client";
import React,{useState} from "react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import Image from "next/image";

type Card = {
  id: number;
  content?:  string;
  className: string;
  thumbnail?: string;
  number?: number;
};

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  return (
    <div className="w-full min-h-[100vh] p-10 grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto z-10 gap-4 relative overflow-hidden">
      {cards.map((card, i) => (
        <div key={i} className={cn(card.className)}>
          <motion.div
            className={cn(
              "relative overflow-hidden bg-white rounded-xl h-full w-full"
            )}
            layoutId={`card-${card.id}`}
          >
            <ImageComponent  card={card} number={card.number ?? 0} />
            
          </motion.div>
        </div>
      ))}
    </div>
  );
};
const ImageComponent = ({ card }: { card: Card; number?: number }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-[330px] rounded-xl overflow-hidden">
      {/* Skeleton while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}

      {typeof card.thumbnail === "string" && card.thumbnail.startsWith("") && (
        <Image
        draggable={false}
          src={card.thumbnail}
          fill
          className={cn(
            "object-cover transition-opacity duration-700",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          alt="card image"
          priority
          onLoadingComplete={() => setIsLoading(false)}
        />
      )}
    </div>
  );
};


