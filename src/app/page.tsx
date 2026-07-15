import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Search, Sparkles } from "lucide-react";
import { CountUp } from "@/components/animations/count-up";
import { HeroDeck } from "@/components/animations/hero-deck";
import { CardTile } from "@/components/tarot/card-tile";
import { SpreadCard } from "@/components/readings/spread-card";
import { tarotCards, tarotSpreads } from "@/lib/tarot";

const stats = [
  [78, "Cartas documentadas"],
  [22, "Arcanos Maiores"],
  [56, "Arcanos Menores"],
  [4, "Naipes elementais"],
] as const;

export default function Home() {
  const heroCards = ["a-lua", "a-sacerdotisa", "a-estrela", "o-sol"].map((id) => tarotCards.find((card) => card.id === id)!);
  const star = tarotCards.find((card) => card.id === "a-estrela")!;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow hero-enter" style={{ "--d": 0 } as React.CSSProperties}>Tarô Rider-Waite · 78 arquétipos</span>
          <h1>
            <span className="hero-line" style={{ "--d": 1 } as React.CSSProperties}>Entre o que{" "}</span>
            <span className="hero-line" style={{ "--d": 2 } as React.CSSProperties}>se revela e o{" "}</span>
            <span className="hero-line" style={{ "--d": 3 } as React.CSSProperties}>que ainda é{" "}</span>
            <span className="hero-line" style={{ "--d": 4 } as React.CSSProperties}><em>mistério.</em></span>
          </h1>
          <p className="hero-enter" style={{ "--d": 5 } as React.CSSProperties}>Conheça cada carta, formule perguntas mais abertas e interprete as cartas que você mesmo retirou do seu baralho físico — nunca como certezas absolutas.</p>
          <div className="button-row hero-enter" style={{ "--d": 6 } as React.CSSProperties}>
            <Link className="button primary" href="/tiragens">Realizar uma tiragem <Sparkles size={17} /></Link>
            <Link className="button" href="/cartas">Conhecer as cartas <ArrowRight size={17} /></Link>
          </div>
        </div>
        <HeroDeck cards={heroCards} />
      </section>
      <section className="stats-strip" aria-label="Estrutura do baralho" data-reveal>
        {stats.map(([value, label]) => (
          <div className="stat" key={label}><strong><CountUp value={value} /></strong><span>{label}</span></div>
        ))}
      </section>
      <section className="section-shell">
        <div className="section-head" data-reveal><div><span className="eyebrow">Arcano em destaque</span><h2>A luz que permanece depois da noite.</h2></div><p>A Estrela fala de esperança, regeneração e confiança serena. Um convite editorial para começar a exploração por uma carta que devolve horizonte ao caminho.</p></div>
        <div style={{ maxWidth: 285 }} data-reveal><CardTile card={star} priority /></div>
      </section>
      <section className="section-shell">
        <div className="section-head" data-reveal><div><span className="eyebrow">Uma biblioteca viva</span><h2>Explore por símbolo, elemento ou pergunta.</h2></div><p>O conteúdo do manual foi estruturado para você atravessar o baralho no seu ritmo, com contexto geral e leituras para futuro, carreira e amor.</p></div>
        <div className="feature-grid">
          <article className="feature-card" data-reveal style={{ "--d": 0 } as React.CSSProperties}><Layers3 className="icon" /><h3>Arcanos em contexto</h3><p>Entenda a diferença entre forças estruturais dos Maiores e cenas cotidianas dos Menores.</p></article>
          <article className="feature-card" data-reveal style={{ "--d": 1 } as React.CSSProperties}><Search className="icon" /><h3>Busca sem barreiras</h3><p>Pesquise nomes, naipes, elementos e significados sem se preocupar com acentos.</p></article>
          <article className="feature-card" data-reveal style={{ "--d": 2 } as React.CSSProperties}><BookOpen className="icon" /><h3>Fonte visível</h3><p>Cada interpretação informa a página do manual que sustenta o conteúdo.</p></article>
        </div>
      </section>
      <section className="section-shell">
        <div className="section-head" data-reveal><div><span className="eyebrow">Seu baralho, sua tiragem</span><h2>Tire as cartas à mão. Registre e interprete aqui.</h2></div><Link className="button" href="/tiragens">Ver todas as tiragens <ArrowRight size={16} /></Link></div>
        <div className="spread-grid">{tarotSpreads.slice(0, 3).map((spread, index) => <div key={spread.id} data-reveal style={{ "--d": index } as React.CSSProperties}><SpreadCard spread={spread} /></div>)}</div>
      </section>
      <section className="section-shell" data-reveal><div className="notice">As interpretações são simbólicas e reflexivas. O conteúdo não substitui aconselhamento profissional médico, psicológico, jurídico ou financeiro.</div></section>
    </>
  );
}
