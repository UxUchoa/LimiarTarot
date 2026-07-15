import Image from "next/image";
import Link from "next/link";
import type { TarotCard, TarotTheme } from "@/types/tarot";
import { elementLabels, meaningFor, suitLabels } from "@/lib/tarot";

export function CardTile({ card, theme = "general", priority = false }: { card: TarotCard; theme?: TarotTheme; priority?: boolean }) {
  return (
    <article className={`card-tile suit-${card.suit || "major"}`}>
      <Link href={`/cartas/${card.slug}`} aria-label={`Conhecer ${card.name}`}>
        <div className="card-image-wrap">
          <Image src={card.thumbnail} alt={`Carta ${card.name} do Tarô Rider-Waite`} fill sizes="(max-width: 600px) 44vw, (max-width: 1100px) 25vw, 210px" priority={priority} />
          <span className="card-number">{card.arcanaType === "major" ? String(card.number).padStart(2, "0") : card.number}</span>
        </div>
        <div className="card-tile-copy">
          <span className="card-meta">{card.arcanaType === "major" ? "Arcano Maior" : `${suitLabels[card.suit!]} · ${elementLabels[card.element!]}`}</span>
          <h3>{card.name}</h3>
          <p>{meaningFor(card, theme)}</p>
        </div>
      </Link>
    </article>
  );
}
