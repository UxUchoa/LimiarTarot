import type { Metadata } from "next";
import { OllamaModelManager } from "@/components/models/ollama-model-manager";

export const metadata: Metadata = {
  title: "Modelos de IA",
  description: "Escolha e gerencie os modelos locais usados nas interpretações do Limiar.",
};

export default function ModelsPage() {
  return (
    <>
      <header className="page-hero models-page-hero">
        <span className="eyebrow">IA local · Ollama</span>
        <h1>Escolha a mente por trás da leitura.</h1>
        <p>Instale, selecione ou exclua modelos sem sair do sistema. Tudo continua rodando localmente no seu computador.</p>
      </header>
      <section className="section-shell models-section" style={{ paddingTop: 0 }}>
        <OllamaModelManager />
      </section>
    </>
  );
}
