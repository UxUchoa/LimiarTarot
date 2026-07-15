"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CardTile } from "./card-tile";
import { filterCards, themeLabels } from "@/lib/tarot";
import type { ArcanaType, CardFilters, TarotCard, TarotElement, TarotSuit, TarotTheme } from "@/types/tarot";
import { feedbackVariants, listItemVariants, motionTransition, reducedVariants } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/hooks/use-hydrated-reduced-motion";

const initial: CardFilters = { query: "", arcanaTypes: [], suits: [], elements: [], ranks: [], numbers: [], theme: "general", sort: "deck" };

export function CardLibrary({ cards }: { cards: TarotCard[] }) {
  const reduceMotion = useHydratedReducedMotion();
  const [filters, setFilters] = useState(initial);
  const filtered = useMemo(() => filterCards(cards, filters), [cards, filters]);
  const toggle = <T,>(key: "arcanaTypes" | "suits" | "elements", value: T) => {
    setFilters((current) => {
      const values = current[key] as T[];
      return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
  };
  const active = JSON.stringify(filters) !== JSON.stringify(initial);
  return (
    <>
      <div className="filters-panel" aria-label="Pesquisa e filtros">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Pesquisar cartas</span>
          <input className="input" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Busque por nome, número, significado…" />
        </label>
        <select className="select" aria-label="Tema da interpretação" value={filters.theme} onChange={(event) => setFilters({ ...filters, theme: event.target.value as TarotTheme })}>
          {Object.entries(themeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="select" aria-label="Ordenar cartas" value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value as CardFilters["sort"] })}>
          <option value="deck">Ordem do baralho</option><option value="name">Nome A–Z</option><option value="number">Número</option>
        </select>
        <div className="filter-chips">
          {([[["major", "Maiores"], ["minor", "Menores"]], "arcanaTypes"] as const)[0].map(([value, label]) => (
            <button key={value} className={`chip ${filters.arcanaTypes.includes(value as ArcanaType) ? "active" : ""}`} onClick={() => toggle<ArcanaType>("arcanaTypes", value as ArcanaType)} aria-pressed={filters.arcanaTypes.includes(value as ArcanaType)}>{label}</button>
          ))}
          {(["cups", "pentacles", "swords", "wands"] as TarotSuit[]).map((value) => {
            const labels = { cups: "Copas", pentacles: "Ouros", swords: "Espadas", wands: "Paus" };
            return <button key={value} className={`chip ${filters.suits.includes(value) ? "active" : ""}`} onClick={() => toggle<TarotSuit>("suits", value)} aria-pressed={filters.suits.includes(value)}>{labels[value]}</button>;
          })}
          {(["water", "earth", "air", "fire"] as TarotElement[]).map((value) => {
            const labels = { water: "Água", earth: "Terra", air: "Ar", fire: "Fogo" };
            return <button key={value} className={`chip ${filters.elements.includes(value) ? "active" : ""}`} onClick={() => toggle<TarotElement>("elements", value)} aria-pressed={filters.elements.includes(value)}>{labels[value]}</button>;
          })}
          <AnimatePresence initial={false}>
            {active && <motion.button className="chip" variants={reduceMotion ? reducedVariants : feedbackVariants} initial="hidden" animate="visible" exit="exit" onClick={() => setFilters(initial)}><RotateCcw size={13} aria-hidden="true" /> Limpar</motion.button>}
          </AnimatePresence>
        </div>
      </div>
      <p className="result-count" aria-live="polite"><motion.span key={`${filtered.length}-${filters.theme}`} variants={reduceMotion ? reducedVariants : feedbackVariants} initial="hidden" animate="visible">{filtered.length} {filtered.length === 1 ? "carta encontrada" : "cartas encontradas"} · contexto: {themeLabels[filters.theme]}</motion.span></p>
      {filtered.length ? (
        <motion.div className="card-grid">
          <AnimatePresence initial>
            {filtered.map((card, index) => <motion.div key={card.id} custom={index} layout={filtered.length <= 24 ? "position" : false} variants={reduceMotion ? reducedVariants : listItemVariants} initial="hidden" animate="visible" exit="exit" transition={motionTransition.standard}><CardTile card={card} theme={filters.theme} /></motion.div>)}
          </AnimatePresence>
        </motion.div>
      ) : <motion.div className="empty-state" variants={reduceMotion ? reducedVariants : feedbackVariants} initial="hidden" animate="visible"><h2>Nenhuma carta atravessou este filtro.</h2><p>Tente remover uma combinação ou buscar outro significado.</p><button className="button" onClick={() => setFilters(initial)}>Limpar filtros</button></motion.div>}
    </>
  );
}
