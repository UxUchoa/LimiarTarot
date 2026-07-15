"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { pageVariants, reducedVariants } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/hooks/use-hydrated-reduced-motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      className="page-transition"
      variants={reduceMotion ? reducedVariants : pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
