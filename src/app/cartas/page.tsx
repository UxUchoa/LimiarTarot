import type { Metadata } from "next";
import { CardLibrary } from "@/components/tarot/card-library";
import { tarotCards } from "@/lib/tarot";

export const metadata: Metadata = { title: "Biblioteca de cartas", description: "Explore as 78 cartas do Tarô Rider-Waite por arcano, naipe, elemento e significado." };

export default function CardsPage() {
  return <><header className="page-hero"><span className="eyebrow">Biblioteca completa</span><h1>Setenta e oito portas para o símbolo.</h1><p>Pesquise pelo que já conhece ou deixe os filtros conduzirem sua exploração. O tema selecionado muda o trecho de interpretação apresentado.</p></header><section className="section-shell" style={{ paddingTop: 0 }}><CardLibrary cards={tarotCards} /></section></>;
}
