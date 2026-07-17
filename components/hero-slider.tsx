"use client";

/**
 * Hero background slider — 5 Zimbabwe scenes crossfading with a slow
 * Ken Burns drift, under a translucent navy overlay that keeps the
 * hero copy readable.
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SLIDES = [
  { src: "/hero/victoria-falls-sunset.jpg", alt: "Victoria Falls at sunset" },
  { src: "/hero/great-zimbabwe-aerial.jpg", alt: "Great Zimbabwe from the air" },
  { src: "/hero/hwange-safari.webp", alt: "Wildlife at a Hwange waterhole" },
  { src: "/hero/great-zimbabwe-tower.webp", alt: "The Great Enclosure at Great Zimbabwe" },
  { src: "/hero/victoria-falls-aerial.jpg", alt: "Victoria Falls and its rainbow" },
];

const INTERVAL_MS = 6000;

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <AnimatePresence>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: INTERVAL_MS / 1000 + 2, ease: "linear" }}
          >
            <Image
              src={SLIDES[index].src}
              alt={SLIDES[index].alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Translucent overlay — keeps copy readable over any slide */}
      <div className="absolute inset-0 bg-gradient-to-b from-safari-950/85 via-safari-950/70 to-safari-950/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-safari-950/60 to-transparent" />

      {/* Slide indicators */}
      <div className="pointer-events-auto absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            aria-label={`Show slide: ${s.alt}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === index ? "w-7 bg-sunset-400" : "w-1.5 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}
