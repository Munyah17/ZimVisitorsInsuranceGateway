"use client";

/**
 * Animation helpers.
 *
 * FadeIn / Stagger / StaggerItem are scroll-reveal wrappers implemented as
 * plain divs + CSS driven by the inline script in app/layout.tsx. Content
 * is visible by default and only animates when JavaScript is healthy, so a
 * failed bundle can never leave the page blank.
 *
 * `motion` and `AnimatePresence` re-export Framer Motion for interactive,
 * post-load animations (wizard steps, drawers, sliders) where a JS failure
 * makes the feature unusable anyway.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

export { motion, AnimatePresence };

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Kept for API compatibility; the travel distance is set in CSS. */
  y?: number;
}) {
  const style: CSSProperties | undefined = delay
    ? { transitionDelay: `${delay}s` }
    : undefined;
  return (
    <div data-reveal className={className} style={style}>
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-stagger className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal className={className}>
      {children}
    </div>
  );
}
