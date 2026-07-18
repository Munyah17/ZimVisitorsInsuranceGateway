"use client";

/**
 * Animation helpers.
 *
 * FadeIn / Stagger / StaggerItem are scroll-reveal wrappers. Content is
 * visible by default (no JS needed); when JS is healthy the elements are
 * hidden then revealed as they enter the viewport. Two cooperating paths
 * make this safe:
 *
 * 1. The inline script in app/layout.tsx handles the FIRST document load,
 *    independent of the React bundle, so a crashed bundle can never leave
 *    the page blank.
 * 2. The useReveal hook below handles CLIENT-SIDE NAVIGATIONS, where new
 *    elements mount after the inline script has already run. Each element
 *    observes itself and reveals, with a failsafe timeout.
 *
 * Both paths are idempotent (adding .reveal-in twice is harmless).
 *
 * `motion` and `AnimatePresence` re-export Framer Motion for interactive,
 * post-load animations (wizard steps, drawers, sliders).
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export { motion, AnimatePresence };

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.classList.contains("reveal-in")) return;

    // Match the inline script's stagger: delay by index among reveal
    // siblings inside the nearest [data-stagger] parent.
    const parent = el.closest("[data-stagger]");
    if (parent && !el.style.transitionDelay) {
      const siblings = Array.from(parent.querySelectorAll("[data-reveal]"));
      const index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = `${index * 0.12}s`;
    }

    if (!("IntersectionObserver" in window)) {
      el.classList.add("reveal-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("reveal-in");
            io.disconnect();
          }
        }
      },
      { rootMargin: "-40px 0px" }
    );
    io.observe(el);

    // Failsafe: never leave content hidden, whatever the observer does.
    const failsafe = window.setTimeout(() => el.classList.add("reveal-in"), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return ref;
}

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
  const ref = useReveal();
  const style: CSSProperties | undefined = delay
    ? { transitionDelay: `${delay}s` }
    : undefined;
  return (
    <div ref={ref} data-reveal className={className} style={style}>
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
  const ref = useReveal();
  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
