"use client";

import Link from "next/link";
import { Brain, Play, RefreshCw } from "lucide-react";
import type { OllamaModelId } from "@/lib/ollama-models";
import type { OllamaModelsResponse } from "@/types/interpretation";

export function OllamaModelSelector({
  catalog,
  selectedModel,
  busy,
  onSelect,
  onGenerate,
  onRefresh,
}: {
  catalog?: OllamaModelsResponse;
  selectedModel: OllamaModelId;
  busy: boolean;
  onSelect: (model: OllamaModelId) => void;
  onGenerate: () => void;
  onRefresh: () => void;
}) {
  const selected = catalog?.models.find((model) => model.id === selectedModel);
  const installedCount = catalog?.models.filter((model) => model.installed).length ?? 0;

  return (
    <section className="ollama-model-panel" aria-labelledby="ollama-model-title">
      <div className="ollama-model-heading">
        <div>
          <span className="eyebrow"><Brain size={14} /> Modelo da interpretação</span>
          <h2 id="ollama-model-title">Escolha a IA local</h2>
          <p>O Limiar aceita até 12 cartas. Modelos de 9B ou mais tendem a manter melhor a coerência nas tiragens longas.</p>
        </div>
        <span className={`ollama-status ${catalog?.available ? "online" : "offline"}`}>
          {catalog ? (catalog.available ? `Ollama online · ${installedCount} instalado${installedCount === 1 ? "" : "s"}` : "Ollama offline") : "Consultando Ollama…"}
        </span>
      </div>

      <div className="ollama-model-controls">
        <label>
          Modelo
          <select
            className="select"
            value={selectedModel}
            disabled={!catalog || busy}
            onChange={(event) => onSelect(event.target.value as OllamaModelId)}
          >
            {(catalog?.models ?? []).map((model) => (
              <option value={model.id} key={model.id}>
                {model.label} · {model.size} · {model.tier}{model.installed ? " · instalado" : " · não instalado"}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row ollama-model-actions">
          <button className="button primary" type="button" disabled={busy || !selected?.installed} onClick={onGenerate}>
            <Play size={16} /> {busy ? "Interpretando…" : "Usar este modelo"}
          </button>
          <button className="button ghost" type="button" disabled={busy} onClick={onRefresh}>
            <RefreshCw size={16} /> Atualizar lista
          </button>
          <Link className="button ghost" href="/modelos">Gerenciar todos</Link>
        </div>
      </div>

      {selected && (
        <div className="ollama-model-detail">
          <strong>{selected.label}</strong>
          <span>{selected.family} · perfil {selected.tier} · contexto {selected.context} · arquivo {selected.size}</span>
          <p>{selected.recommendation}</p>
          {!selected.installed && <p className="ollama-install-hint">Para instalar, execute <code>ollama pull {selected.id}</code> ou abra <code>ABRIR_LIMIAR_TARO.bat --ollama-only</code>.</p>}
        </div>
      )}
    </section>
  );
}
