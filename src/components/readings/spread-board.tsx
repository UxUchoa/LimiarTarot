"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { getCard } from "@/lib/tarot";
import type { ReadingCard, TarotSpread } from "@/types/tarot";

export function SpreadBoard({ spread, cards, revealedCardIds, onReveal }: { spread: TarotSpread; cards: ReadingCard[]; revealedCardIds: string[]; onReveal?: (id: string) => void }) {
  const isCompact = spread.cardCount <= 3;
  return (
    <div className={`spread-board ${isCompact ? `spread-board-linear spread-board-count-${spread.cardCount}` : "spread-board-map"}`} style={isCompact ? { gridTemplateColumns: `repeat(${spread.cardCount}, minmax(0, 1fr))` } : undefined} aria-label={`Disposição ${spread.name}`}>
      {cards.map((readingCard, index) => {
        const card = getCard(readingCard.cardId);
        const position = spread.positions.find((item) => item.id === readingCard.positionId);
        if (!card || !position) return null;
        const revealed = revealedCardIds.includes(card.id);
        const cardStyle = {
          ...(isCompact ? {} : { left: `${position.x}%`, top: `${position.y}%`, transform: `translate(-50%,-50%) rotate(${position.rotation}deg)` }),
          "--card-delay": `${Math.min(index, 10) * 35}ms`,
        } as CSSProperties;
        return (
          <button
            type="button"
            key={`${readingCard.positionId}-${card.id}`}
            className={`reading-card ${revealed ? "revealed" : ""}`}
            style={cardStyle}
            onClick={() => !revealed && onReveal?.(card.id)}
            disabled={revealed || !onReveal}
            aria-label={revealed ? `${position.name}: ${card.name}` : `Revelar carta da posição ${position.name}`}
          >
            <span className="reading-card-inner">
              <span className="reading-card-back"><span aria-hidden="true">✦</span></span>
              <span className="reading-card-front"><Image src={card.thumbnail} alt="" fill sizes="150px" /></span>
            </span>
            <span className="position-label"><strong>{position.order}. {position.name}</strong>{revealed && <small>{card.name}</small>}</span>
          </button>
        );
      })}
    </div>
  );
}
