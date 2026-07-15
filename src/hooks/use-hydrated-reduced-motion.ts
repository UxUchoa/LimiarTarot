"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const subscribe = () => () => undefined;

/**
 * Mantém o primeiro render do navegador igual ao SSR e só aplica a preferência
 * de movimento reduzido depois que a hidratação foi concluída.
 */
export function useHydratedReducedMotion() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const reduceMotion = useReducedMotion();
  return hydrated && Boolean(reduceMotion);
}
