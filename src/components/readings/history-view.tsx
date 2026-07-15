"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { clearHistory, deleteSession, getCard, getSpread, readHistory, themeLabels } from "@/lib/tarot";
import type { ReadingSession } from "@/types/tarot";
import { feedbackVariants, listItemVariants, reducedVariants } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/hooks/use-hydrated-reduced-motion";

export function HistoryView() {
  const reduceMotion = useHydratedReducedMotion();
  const [sessions, setSessions] = useState<ReadingSession[] | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setSessions(readHistory()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const remove = (id: string) => { deleteSession(id); setSessions(readHistory()); };
  const clear = () => { if (confirm("Limpar todo o histórico deste dispositivo?")) { clearHistory(); setSessions([]); } };
  if (sessions === null) return <div className="history-skeleton" aria-label="Carregando histórico" aria-busy="true">{[0, 1].map((item) => <div className="skeleton history-card-skeleton" key={item}><span /><span /><span /></div>)}</div>;
  if (!sessions.length) return <motion.div className="empty-state" variants={reduceMotion ? reducedVariants : feedbackVariants} initial="hidden" animate="visible"><h2>Seu histórico está vazio.</h2><p>As tiragens concluídas neste dispositivo aparecerão aqui.</p><Link className="button primary" href="/tiragens">Realizar uma tiragem</Link></motion.div>;
  return <><div className="history-toolbar"><motion.p key={sessions.length} variants={reduceMotion ? reducedVariants : feedbackVariants} initial="hidden" animate="visible">{sessions.length} {sessions.length === 1 ? "tiragem salva" : "tiragens salvas"}</motion.p><button className="button" onClick={clear}><Trash2 size={15} /> Limpar tudo</button></div><motion.div className="history-list"><AnimatePresence initial>{sessions.map((session, index) => { const spread = getSpread(session.spreadId); return <motion.article className="history-card" key={session.id} custom={index} variants={reduceMotion ? reducedVariants : listItemVariants} initial="hidden" animate="visible" exit="exit" layout><div><span className="eyebrow">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.createdAt))}</span><h2>{spread?.name || "Tiragem"}</h2><p>“{session.question}”</p><div className="history-cards">{session.cards.map((item) => <span key={item.positionId}>{getCard(item.cardId)?.name}</span>)}</div></div><div className="history-actions"><span className="pill">{session.mode === "physical" ? "Baralho físico" : "Versão anterior"}</span><span className="pill">{themeLabels[session.theme]}</span><Link className="button" href={`/tiragens/resultado/${session.id}`}>Abrir resultado</Link><button className="icon-button" onClick={() => remove(session.id)} aria-label="Excluir esta tiragem"><Trash2 size={17} /></button></div></motion.article>; })}</AnimatePresence></motion.div></>;
}
