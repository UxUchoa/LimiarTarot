import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { CardTile } from "@/components/tarot/card-tile";
import { elementLabels, getCard, getRelatedCards, meaningFor, suitLabels, tarotCards, themeLabels } from "@/lib/tarot";
import type { TarotTheme } from "@/types/tarot";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return tarotCards.map((card) => ({ slug: card.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = getCard((await params).slug);
  if (!card) return {};
  return { title: card.name, description: card.summary, openGraph: { title: `${card.name} — Limiar`, description: card.summary, images: [{ url: card.image }] } };
}

export default async function CardDetailPage({ params }: Props) {
  const card = getCard((await params).slug);
  if (!card) notFound();
  const previous = tarotCards[(card.deckOrder - 1 + tarotCards.length) % tarotCards.length];
  const next = tarotCards[(card.deckOrder + 1) % tarotCards.length];
  const related = getRelatedCards(card);
  const themes: TarotTheme[] = ["general", "future", "career", "love"];
  return (
    <>
      <article className="detail-layout">
        <div className="detail-image"><div className="detail-image-frame"><Image src={card.image} alt={`Carta ${card.name} do Tarô Rider-Waite`} fill sizes="(max-width: 900px) 80vw, 420px" priority /></div></div>
        <div className="detail-copy">
          <span className="detail-subtitle">{card.arcanaType === "major" ? `Arcano Maior · ${card.number}` : `Arcano Menor · ${suitLabels[card.suit!]} · ${elementLabels[card.element!]}`}</span>
          <h1>{card.name}</h1>
          <div className="keyword-row">{card.keywords.map((keyword) => <span className="pill" key={keyword}>{keyword}</span>)}</div>
          <p className="lead">{card.archetype}</p>
          <div className="meaning-tabs">
            {themes.map((theme) => <section className="meaning-card" key={theme}><h2>{themeLabels[theme]}</h2><p>{meaningFor(card, theme)}</p>{!card.meanings[theme] && <span className="pill">Pendente na fonte</span>}</section>)}
          </div>
          <aside className="source-note">Fonte: <strong>{card.source.documentTitle}</strong>, {card.source.pageStart === card.source.pageEnd ? `página ${card.source.pageStart}` : `páginas ${card.source.pageStart}–${card.source.pageEnd}`}. {card.reviewStatus === "needs-review" && "O manual não separa todos os eixos interpretativos desta carta; a ausência foi preservada para revisão."}</aside>
          <div className="button-row"><Link className="button primary" href="/tiragens/linha-do-tempo"><Sparkles size={16} /> Iniciar tiragem física</Link><a className="button" href={card.imageAttribution.sourceUrl} target="_blank" rel="noreferrer">Crédito da imagem</a></div>
          <nav className="prev-next" aria-label="Carta anterior e seguinte"><Link href={`/cartas/${previous.slug}`}><ArrowLeft size={16} /> {previous.name}</Link><Link href={`/cartas/${next.slug}`}>{next.name} <ArrowRight size={16} /></Link></nav>
        </div>
      </article>
      <section className="section-shell"><div className="section-head"><div><span className="eyebrow">Ressonâncias</span><h2>Cartas relacionadas</h2></div><p>Relações construídas por arcano, naipe, elemento e palavras compartilhadas.</p></div><div className="card-grid">{related.map((item) => <CardTile card={item} key={item.id} />)}</div></section>
    </>
  );
}
