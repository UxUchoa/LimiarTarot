"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, RotateCw, Sparkles } from "lucide-react";
import { dailyCardIndex, millisecondsUntilNextLocalDay } from "@/lib/daily-card";

export interface DailyCardItem {
  id: string;
  slug: string;
  name: string;
  thumbnail: string;
  number: number;
  arcanaLabel: string;
  summary: string;
  keywords: string[];
}

function dateLabel(date: Date): string {
  const value = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function DailyCardFeature({ cards }: { cards: DailyCardItem[] }) {
  const [currentDate, setCurrentDate] = useState<Date>();

  useEffect(() => {
    let timer: number;
    const update = () => {
      const now = new Date();
      setCurrentDate(now);
      timer = window.setTimeout(update, millisecondsUntilNextLocalDay(now));
    };
    update();
    return () => window.clearTimeout(timer);
  }, []);

  const card = useMemo(
    () => currentDate && cards.length ? cards[dailyCardIndex(currentDate, cards.length)] : undefined,
    [cards, currentDate],
  );

  if (!card || !currentDate) {
    return (
      <section className="section-shell daily-card-section" aria-label="Preparando a carta do dia" aria-busy="true">
        <div className="daily-card-skeleton skeleton"><span /><div><span /><span /><span /></div></div>
      </section>
    );
  }

  return (
    <section className="section-shell daily-card-section" aria-labelledby="daily-card-title">
      <div className="daily-card-feature">
        <Link className="daily-card-visual" href={`/cartas/${card.slug}`} aria-label={`Conhecer a carta do dia: ${card.name}`}>
          <div className="daily-card-glow" aria-hidden="true" />
          <div className="daily-card-frame">
            <Image src={card.thumbnail} alt={`Carta do dia: ${card.name}`} fill sizes="(max-width: 640px) 72vw, 300px" priority />
            <span>{String(card.number).padStart(2, "0")}</span>
          </div>
        </Link>

        <div className="daily-card-copy">
          <span className="eyebrow"><CalendarDays size={14} /> Carta do dia · {dateLabel(currentDate)}</span>
          <h2 id="daily-card-title">{card.name}</h2>
          <span className="daily-card-arcana"><Sparkles size={14} /> {card.arcanaLabel}</span>
          <p>{card.summary}</p>
          <div className="daily-card-keywords" aria-label="Palavras-chave da carta">
            {card.keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
          <div className="daily-card-actions">
            <Link className="button primary" href={`/cartas/${card.slug}`}>Explorar esta carta <ArrowRight size={16} /></Link>
            <span><RotateCw size={14} /> Uma nova carta aparece à meia-noite.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
