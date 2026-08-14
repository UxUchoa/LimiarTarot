"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BrainCircuit, Check, RefreshCw, Settings2 } from "lucide-react";
import {
  DEFAULT_OLLAMA_MODEL,
  isSupportedOllamaModel,
  OLLAMA_MODEL_STORAGE_KEY,
} from "@/lib/ollama-models";
import type { OllamaModelId } from "@/lib/ollama-models";
import type { OllamaModelsResponse } from "@/types/interpretation";

export function ReadingModelPicker() {
  const [catalog, setCatalog] = useState<OllamaModelsResponse>();
  const [selectedModel, setSelectedModel] = useState<OllamaModelId>(DEFAULT_OLLAMA_MODEL);
  const [feedback, setFeedback] = useState("");

  const loadModels = useCallback(async () => {
    try {
      const response = await fetch("/api/interpretations", { cache: "no-store" });
      const payload = await response.json() as OllamaModelsResponse;
      if (!response.ok || !payload.ok || !Array.isArray(payload.models)) throw new Error("Catálogo inválido.");

      let saved: unknown;
      try { saved = window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY); } catch { saved = null; }
      const installed = payload.models.filter((model) => model.installed);
      const next = isSupportedOllamaModel(saved) && installed.some((model) => model.id === saved)
        ? saved
        : installed.find((model) => model.id === payload.defaultModel)?.id ?? installed[0]?.id ?? payload.defaultModel;

      setCatalog(payload);
      setSelectedModel(next);
      setFeedback("");
    } catch {
      setFeedback("O Ollama não respondeu. A leitura básica continuará disponível.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadModels(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadModels]);

  const installedModels = catalog?.models.filter((model) => model.installed) ?? [];
  const selected = installedModels.find((model) => model.id === selectedModel);

  const chooseModel = (model: OllamaModelId) => {
    const item = installedModels.find((candidate) => candidate.id === model);
    if (!item) return;
    setSelectedModel(model);
    try {
      window.localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, model);
      setFeedback(`${item.label} selecionado para esta e as próximas tiragens.`);
    } catch {
      setFeedback(`${item.label} selecionado para esta tiragem, mas a preferência não pôde ser salva.`);
    }
  };

  return (
    <section className="reading-model-picker" aria-labelledby="reading-model-title">
      <div className="reading-model-copy">
        <span className="eyebrow"><BrainCircuit size={14} /> IA da interpretação</span>
        <h3 id="reading-model-title">Qual modelo deve interpretar esta tiragem?</h3>
        <p>O instalador .bat apenas baixa os modelos. A troca do modelo ativo é feita aqui, dentro do Limiar.</p>
      </div>

      <div className="reading-model-control">
        <label>
          Modelo ativo
          <select
            className="select"
            aria-label="Modelo para esta tiragem"
            value={selectedModel}
            disabled={!catalog?.available || installedModels.length === 0}
            onChange={(event) => chooseModel(event.target.value as OllamaModelId)}
          >
            {installedModels.length > 0 ? installedModels.map((model) => (
              <option value={model.id} key={model.id}>{model.label} · {model.size} · {model.tier}</option>
            )) : <option value={selectedModel}>Nenhum modelo instalado</option>}
          </select>
        </label>
        <div className="reading-model-links">
          <Link className="button ghost" href="/modelos"><Settings2 size={16} /> Instalar ou excluir</Link>
          <button className="button ghost" type="button" onClick={() => void loadModels()} aria-label="Atualizar modelos instalados"><RefreshCw size={16} /></button>
        </div>
      </div>

      {selected && <p className="reading-model-current"><Check size={15} /> <strong>{selected.label}</strong> será usado quando a interpretação for gerada.</p>}
      {feedback && <p className="reading-model-feedback" role="status">{feedback}</p>}
    </section>
  );
}
