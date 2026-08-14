import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";

afterEach(() => vi.unstubAllGlobals());

describe("catálogo local de modelos Ollama", () => {
  it("marca apenas os modelos compatíveis que estão instalados", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      models: [{ name: "qwen3.5:9b" }, { name: "modelo-fora-do-catalogo:latest" }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const response = await GET();
    const payload = await response.json();
    expect(payload.available).toBe(true);
    expect(payload.models).toHaveLength(6);
    expect(payload.models.find((model: { id: string }) => model.id === "qwen3.5:9b").installed).toBe(true);
    expect(payload.models.filter((model: { installed: boolean }) => model.installed)).toHaveLength(1);
  });

  it("instala um modelo permitido e encaminha o progresso do Ollama", async () => {
    const progress = [
      JSON.stringify({ status: "pulling manifest" }),
      JSON.stringify({ status: "downloading", completed: 50, total: 100 }),
      JSON.stringify({ status: "success" }),
    ].join("\n") + "\n";
    const ollamaFetch = vi.fn().mockResolvedValue(new Response(progress, {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson" },
    }));
    vi.stubGlobal("fetch", ollamaFetch);
    const request = new Request("http://localhost/api/interpretations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemma3:4b" }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");
    expect(await response.text()).toBe(progress);
    expect(ollamaFetch).toHaveBeenCalledTimes(1);
    expect(ollamaFetch.mock.calls[0][0]).toBe("http://127.0.0.1:11434/api/pull");
    expect(ollamaFetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ model: "gemma3:4b", stream: true }),
    });
  });

  it("rejeita instalação de modelo arbitrário antes de chamar o Ollama", async () => {
    const ollamaFetch = vi.fn();
    vi.stubGlobal("fetch", ollamaFetch);
    const request = new Request("http://localhost/api/interpretations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "modelo-nao-permitido:latest" }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(400);
    expect(ollamaFetch).not.toHaveBeenCalled();
  });

  it("remove somente um modelo da lista permitida", async () => {
    const ollamaFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", ollamaFetch);
    const request = new Request("http://localhost/api/interpretations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemma3:4b" }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(200);
    expect(ollamaFetch).toHaveBeenCalledTimes(1);
    expect(ollamaFetch.mock.calls[0][0]).toBe("http://127.0.0.1:11434/api/delete");
    expect(ollamaFetch.mock.calls[0][1]).toMatchObject({ method: "DELETE", body: JSON.stringify({ model: "gemma3:4b" }) });
  });

  it("rejeita remoção de modelo arbitrário antes de chamar o Ollama", async () => {
    const ollamaFetch = vi.fn();
    vi.stubGlobal("fetch", ollamaFetch);
    const request = new Request("http://localhost/api/interpretations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "qualquer/modelo:latest" }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(400);
    expect(ollamaFetch).not.toHaveBeenCalled();
  });
});
