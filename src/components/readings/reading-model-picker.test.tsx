import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ReadingModelPicker } from "./reading-model-picker";
import { OLLAMA_MODELS, OLLAMA_MODEL_STORAGE_KEY } from "@/lib/ollama-models";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("seletor de modelo no início da tiragem", () => {
  it("troca no frontend entre os modelos instalados e salva a escolha", async () => {
    window.localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, "gemma3:12b");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      available: true,
      defaultModel: "gemma3:12b",
      models: OLLAMA_MODELS.map((model) => ({
        ...model,
        installed: ["gemma3:12b", "qwen3.5:9b"].includes(model.id),
      })),
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ReadingModelPicker />);
    const picker = await screen.findByRole("combobox", { name: "Modelo para esta tiragem" });
    expect(picker).toHaveValue("gemma3:12b");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    fireEvent.change(picker, { target: { value: "qwen3.5:9b" } });

    expect(picker).toHaveValue("qwen3.5:9b");
    expect(window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY)).toBe("qwen3.5:9b");
    expect(screen.getByText("Qwen 3.5 9B selecionado para esta e as próximas tiragens.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Instalar ou excluir" })).toHaveAttribute("href", "/modelos");
  });
});
