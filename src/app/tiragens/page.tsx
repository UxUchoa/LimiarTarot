import type { Metadata } from "next";
import { SpreadCard } from "@/components/readings/spread-card";
import { tarotSpreads } from "@/lib/tarot";

export const metadata: Metadata = { title: "Tiragens", description: "Escolha leituras de uma, duas ou três cartas, registre sequências que saltaram do baralho ou use métodos aprofundados." };

export default function SpreadsPage() {
  return <><header className="page-hero"><span className="eyebrow">Prática com baralho físico</span><h1>Suas mãos tiram as cartas. O Limiar ajuda a interpretá-las.</h1><p>Escolha uma disposição, formule a pergunta e faça a tiragem com seu próprio baralho. Depois, registre no site as cartas na ordem em que saíram.</p></header><section className="section-shell" style={{ paddingTop: 0 }}><div className="notice" style={{ marginBottom: "2rem" }}>O site não sorteia cartas. Tenha seu baralho Rider-Waite em mãos antes de iniciar. O resultado descreve símbolos e possibilidades a partir do manual e não substitui orientação profissional.</div><div className="spread-grid">{tarotSpreads.map((spread, index) => <div key={spread.id} data-reveal style={{ "--d": index % 3 } as React.CSSProperties}><SpreadCard spread={spread} /></div>)}</div></section></>;
}
