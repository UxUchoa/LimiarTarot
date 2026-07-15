const MINIMUM_ESTIMATE_SECONDS = 60;

export function initialInterpretationEstimate(cardCount: number): number {
  return Math.max(MINIMUM_ESTIMATE_SECONDS, cardCount * 15);
}

export function updateInterpretationEstimate(previousSeconds: number | undefined, actualSeconds: number): number {
  const safeActual = Math.max(1, actualSeconds);
  if (!previousSeconds || !Number.isFinite(previousSeconds)) return Math.round(safeActual);
  return Math.round((previousSeconds * 0.65) + (safeActual * 0.35));
}

export function estimatedInterpretationProgress(elapsedSeconds: number, estimateSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed < 1.5) return Math.round(8 + (elapsed / 1.5) * 10);
  if (elapsed < 4) return Math.round(18 + ((elapsed - 1.5) / 2.5) * 12);
  const estimate = Math.max(10, estimateSeconds);
  const generationElapsed = elapsed - 4;
  return Math.min(92, Math.round(30 + 62 * (1 - Math.exp(-generationElapsed / estimate))));
}

export function interpretationPhase(elapsedSeconds: number): "validating" | "preparing" | "interpreting" {
  if (elapsedSeconds < 1.5) return "validating";
  if (elapsedSeconds < 4) return "preparing";
  return "interpreting";
}
