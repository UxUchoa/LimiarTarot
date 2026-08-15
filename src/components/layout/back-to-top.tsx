"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { feedbackVariants, reducedVariants } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/hooks/use-hydrated-reduced-motion";

const THRESHOLD = 900;

export function BackToTop() {
  const reduceMotion = useHydratedReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(scrollY > THRESHOLD);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.button
          type="button"
          className="back-to-top"
          aria-label="Voltar ao topo da página"
          variants={reduceMotion ? reducedVariants : feedbackVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
        >
          <ArrowUp size={18} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
