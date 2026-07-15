import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <span className="eyebrow">Limiar</span>
        <h2>Um espaço entre símbolo e reflexão.</h2>
      </div>
      <p>As interpretações apresentadas possuem finalidade informativa, simbólica e reflexiva. O conteúdo não substitui aconselhamento médico, psicológico, jurídico ou financeiro profissional.</p>
      <nav aria-label="Links do rodapé">
        <Link href="/cartas">Biblioteca</Link>
        <Link href="/tiragens">Tiragens</Link>
        <Link href="/guia">Guia</Link>
      </nav>
      <small>Conteúdo interpretativo: Manual do Tarô de Waite. Imagens: Rider-Waite 1909, domínio público.</small>
    </footer>
  );
}
