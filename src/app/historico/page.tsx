import type { Metadata } from "next";
import { HistoryView } from "@/components/readings/history-view";

export const metadata: Metadata = { title: "Histórico local", description: "Consulte as tiragens salvas neste dispositivo." };
export default function HistoryPage() { return <><header className="page-hero"><span className="eyebrow">Memória local</span><h1>As perguntas que você já atravessou.</h1><p>Este histórico existe apenas neste navegador. Nenhuma pergunta ou carta é enviada para uma conta ou servidor.</p></header><section className="section-shell" style={{ paddingTop: 0 }}><HistoryView /></section></>; }
