import type { Transition, Variants } from "motion/react";

export const motionDuration = {
  fast: 0.16,
  standard: 0.24,
  page: 0.38,
  exit: 0.14,
} as const;

export const motionEase = {
  out: [0.16, 1, 0.3, 1],
  in: [0.4, 0, 1, 1],
  standard: [0.2, 0, 0, 1],
} as const;

export const motionTransition: Record<"fast" | "standard" | "page" | "exit", Transition> = {
  fast: { duration: motionDuration.fast, ease: motionEase.out },
  standard: { duration: motionDuration.standard, ease: motionEase.out },
  page: { duration: motionDuration.page, ease: motionEase.out },
  exit: { duration: motionDuration.exit, ease: motionEase.in },
};

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: motionTransition.page },
  exit: { opacity: 0, y: -8, transition: motionTransition.exit },
};

export const stageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: motionTransition.standard },
  exit: { opacity: 0, y: -8, transition: motionTransition.exit },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...motionTransition.standard,
      delay: Math.min(Number(index), 12) * 0.025,
    },
  }),
  exit: { opacity: 0, y: -8, scale: 0.985, transition: motionTransition.exit },
};

export const feedbackVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: motionTransition.fast },
  exit: { opacity: 0, y: -4, transition: motionTransition.exit },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: motionTransition.standard },
  exit: { opacity: 0, transition: motionTransition.exit },
};

export const drawerVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: motionTransition.standard },
  exit: { opacity: 0, x: 16, transition: motionTransition.exit },
};

export const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: motionDuration.fast } },
  exit: { opacity: 0, transition: { duration: motionDuration.exit } },
};
