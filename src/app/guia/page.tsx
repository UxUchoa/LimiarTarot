import type { Metadata } from "next";
import { tarotGuide } from "@/lib/tarot";

export const metadata: Metadata = { title: "Guia do Tarô", description: "Aprenda a estrutura do Tarô de Waite, formule perguntas e escolha uma tiragem." };

export default function GuidePage() {
  const structuredData = { "@context": "https://schema.org", "@type": "Article", headline: "Guia do Tarô Rider-Waite", inLanguage: "pt-BR", author: { "@type": "Organization", name: "Limiar" } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><header className="page-hero"><span className="eyebrow">Fundamentos</span><h1>Antes de tirar as cartas, aprenda a perguntar.</h1><p>Um percurso introdutório para compreender a estrutura do baralho, escolher uma tiragem e relacionar cada carta física à posição ocupada.</p></header><section className="section-shell" style={{ paddingTop: 0 }}><div className="guide-layout"><nav className="guide-nav" aria-label="Tópicos do guia">{tarotGuide.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</nav><div className="guide-sections">{tarotGuide.map((section) => <article className="guide-card" id={section.id} key={section.id} data-reveal><small>Manual · {section.sourcePages.map((page) => `p. ${page}`).join(" · ")}</small><h2>{section.title}</h2><p>{section.body}</p></article>)}</div></div></section></>;
}
