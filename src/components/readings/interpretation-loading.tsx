"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Brain, CircleStop } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getCard } from "@/lib/tarot";
import { estimatedInterpretationProgress, interpretationPhase } from "@/lib/interpretation-timing";
import { feedbackVariants, listItemVariants, reducedVariants, stageVariants } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/hooks/use-hydrated-reduced-motion";
import type { ReadingSession, TarotSpread } from "@/types/tarot";

const phaseCopy = {
  validating: ["Validando cartas", "Conferindo a ordem e as posições da tiragem."],
  preparing: ["Preparando contexto", "Reunindo apenas os trechos documentados das cartas selecionadas."],
  interpreting: ["Relacionando símbolos", "Gemma 3 está cruzando pergunta, posições e significados do manual."],
} as const;

function formatSeconds(value: number) {
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return seconds ? `${minutes}min ${seconds}s` : `${minutes}min`;
}

export function InterpretationLoading({
  session,
  spread,
  estimateSeconds,
  onCancel,
}: {
  session: ReadingSession;
  spread: TarotSpread;
  estimateSeconds: number;
  onCancel: () => void;
}) {
  const reduceMotion = useHydratedReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => window.clearInterval(timer);
  }, []);
  const progress = estimatedInterpretationProgress(elapsed, estimateSeconds);
  const phase = interpretationPhase(elapsed);
  const [title, description] = phaseCopy[phase];
  const remaining = Math.max(0, estimateSeconds - elapsed);
  const cards = useMemo(() => session.cards.map((item) => getCard(item.cardId)).filter(Boolean), [session.cards]);

  return (
    <motion.section className="ai-loading" aria-live="polite" aria-busy="true" variants={reduceMotion ? reducedVariants : stageVariants} initial="hidden" animate="visible">
      <div className="ai-orbit" aria-hidden="true"><span /><span /><span /><Brain size={38} /></div>
      <span className="eyebrow">Interpretação local · Gemma 3 12B</span>
      <AnimatePresence mode="wait" initial={false}><motion.div className="ai-phase-copy" key={phase} variants={reduceMotion ? reducedVariants : feedbackVariants} initial="hidden" animate="visible" exit="exit"><h1>{title}</h1><p>{description}</p></motion.div></AnimatePresence>
      <blockquote>“{session.question}”</blockquote>
      <div className="ai-loading-cards" aria-label={`Cartas de ${spread.name}`}>{cards.map((card, index) => card && <motion.div key={card.id} custom={index} variants={reduceMotion ? reducedVariants : listItemVariants} initial="hidden" animate="visible"><span><Image src={card.thumbnail} alt="" fill sizes="54px" /></span><small>{spread.positions[index]?.name}</small><strong>{card.name}</strong></motion.div>)}</div>
      <div className="ai-progress-meta"><span>{progress}% estimado</span><span>{formatSeconds(elapsed)} decorridos</span></div>
      <div className="ai-progress" role="progressbar" aria-label="Progresso estimado da interpretação" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
      <p className="ai-estimate">{elapsed < estimateSeconds ? `Tempo restante estimado: ${formatSeconds(remaining)}.` : "A resposta está levando mais tempo que a média estimada."} A primeira leitura pode demorar mais enquanto o modelo é carregado.</p>
      <button className="button ghost" type="button" onClick={onCancel}><CircleStop size={16} /> Cancelar e usar leitura básica</button>
    </motion.section>
  );
}
