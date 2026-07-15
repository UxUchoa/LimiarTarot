import Link from "next/link";

export default function NotFound() { return <section className="section-shell"><div className="empty-state"><span className="eyebrow">Caminho interrompido</span><h1>Esta página não foi encontrada.</h1><p>Volte à biblioteca e escolha outra porta de entrada.</p><Link className="button primary" href="/cartas">Ir para as cartas</Link></div></section>; }
