"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const el of document.querySelectorAll("[data-reveal]")) el.classList.add("is-revealed");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    for (const el of document.querySelectorAll("[data-reveal]:not(.is-revealed)")) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
