import Link from "next/link";
import { spreadCardCountLabel } from "@/lib/tarot";
import type { TarotSpread } from "@/types/tarot";

export function SpreadCard({ spread }: { spread: TarotSpread }) {
  return (
    <article className="spread-card">
      <div className="mini-layout" aria-hidden="true">
        {spread.positions.map((position) => <span key={position.id} className="mini-card" style={{ left: `${position.x}%`, top: `${position.y}%`, transform: `translate(-50%,-50%) rotate(${position.rotation}deg)` }} />)}
      </div>
      <span className="eyebrow">{spreadCardCountLabel(spread)} · {spread.duration}</span>
      <h3>{spread.name}</h3>
      <p>{spread.description}</p>
      <div className="spread-card-tags">{spread.recommendedFor.slice(0, 2).map((tag) => <span className="pill" key={tag}>{tag}</span>)}</div>
      <Link className="button" href={`/tiragens/${spread.slug}`}>Iniciar tiragem</Link>
    </article>
  );
}
