import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ReadingExperience } from "@/components/readings/reading-experience";
import { getSpread, spreadCardCountLabel, tarotSpreads } from "@/lib/tarot";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return tarotSpreads.map((spread) => ({ slug: spread.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const spread = getSpread((await params).slug); return spread ? { title: spread.name, description: spread.description } : {}; }

export default async function ReadingPage({ params }: Props) {
  const spread = getSpread((await params).slug);
  if (!spread) notFound();
  return <><header className="page-hero compact"><span className="eyebrow">{spreadCardCountLabel(spread)} · {spread.duration}</span><h1>{spread.name}</h1><p>{spread.description}</p></header><section className="section-shell" style={{ paddingTop: 0 }}><Suspense fallback={<div className="reading-panel">Preparando a mesa…</div>}><ReadingExperience spread={spread} /></Suspense></section></>;
}
