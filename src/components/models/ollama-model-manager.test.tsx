import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { OllamaModelManager } from "./ollama-model-manager";
import { OLLAMA_MODELS, OLLAMA_MODEL_STORAGE_KEY } from "@/lib/ollama-models";

const catalog = {
  ok: true as const,
  available: true,
  defaultModel: "gemma3:12b" as const,
  models: OLLAMA_MODELS.map((model) => ({
    ...model,
    installed: ["gemma3:12b", "qwen3.5:9b"].includes(model.id),
  })),
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("gerenciador de modelos no frontend", () => {
  it("instala pelo card, acompanha o progresso e seleciona o modelo instalado", async () => {
    const refreshedCatalog = {
      ...catalog,
      models: catalog.models.map((model) => ({ ...model, installed: model.id === "gemma3:4b" })),
    };
    const progress = [
      JSON.stringify({ status: "pulling manifest" }),
      JSON.stringify({ status: "downloading", completed: 50, total: 100 }),
      JSON.stringify({ status: "success" }),
    ].join("\n") + "\n";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(progress, { status: 200, headers: { "Content-Type": "application/x-ndjson" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(refreshedCatalog), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OllamaModelManager />);
    const gemmaCard = (await screen.findByRole("heading", { name: "Gemma 3 4B" })).closest("article");
    expect(gemmaCard).not.toBeNull();
    fireEvent.click(within(gemmaCard!).getByRole("button", { name: "Instalar modelo" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ model: "gemma3:4b" });
    expect(window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY)).toBe("gemma3:4b");
    expect(await screen.findByText("Gemma 3 4B foi instalado e selecionado para as próximas tiragens.")).toBeInTheDocument();
    expect(within(gemmaCard!).getByText("Ativo")).toBeInTheDocument();
  });

  it("salva no navegador o modelo escolhido na interface", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(catalog), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OllamaModelManager />);
    const qwenCard = (await screen.findByRole("heading", { name: "Qwen 3.5 9B" })).closest("article");
    expect(qwenCard).not.toBeNull();
    fireEvent.click(within(qwenCard!).getByRole("button", { name: "Usar nas leituras" }));

    expect(window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY)).toBe("qwen3.5:9b");
    expect(within(qwenCard!).getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Qwen 3.5 9B será usado nas próximas interpretações.")).toBeInTheDocument();
  });

  it("exclui um modelo instalado pela interface depois da confirmação", async () => {
    window.localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, "qwen3.5:9b");
    const refreshedCatalog = {
      ...catalog,
      models: catalog.models.map((model) => ({ ...model, installed: model.id === "gemma3:12b" })),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, model: "qwen3.5:9b" }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(refreshedCatalog), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OllamaModelManager />);
    const qwenCard = (await screen.findByRole("heading", { name: "Qwen 3.5 9B" })).closest("article");
    expect(qwenCard).not.toBeNull();
    fireEvent.click(within(qwenCard!).getByRole("button", { name: "Excluir do computador" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir Qwen 3.5 9B?" });
    const confirmButton = within(dialog).getByRole("button", { name: "Confirmar exclusão" });
    expect(confirmButton).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Nome exato do modelo"), { target: { value: "qwen3.5:9b" } });
    expect(confirmButton).toBeEnabled();
    fireEvent.click(confirmButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ model: "qwen3.5:9b" });
    expect(window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY)).toBeNull();
    expect(await screen.findByText("Qwen 3.5 9B foi excluído do computador.")).toBeInTheDocument();
  });
});
