import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ReadingExperience } from "./reading-experience";
import { getSpread } from "@/lib/tarot";
import type { TarotSpread } from "@/types/tarot";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span role="img" aria-label={alt || "Carta"} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./spread-board", () => ({ SpreadBoard: () => <div data-testid="spread-board">Cartas da tiragem</div> }));

const spread = getSpread("linha-do-tempo") as TarotSpread;
const question = "O que preciso compreender sobre esta mudança de trabalho?";

beforeEach(() => {
  // O painel de modelos consulta o Ollama assim que a etapa da pergunta monta.
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sem ollama no teste")));
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function advanceToSelection() {
  fireEvent.change(await screen.findByRole("textbox", { name: /pergunta aberta/i }), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: /Preparar baralho físico/i }));
  fireEvent.click(await screen.findByRole("button", { name: /Já tirei minhas cartas/i }));
  return screen.findByRole("textbox", { name: /Buscar a carta física/i });
}

describe("experiência de tiragem", () => {
  it("registra a primeira carta da busca com Enter", async () => {
    render(<ReadingExperience spread={spread} />);
    const search = await advanceToSelection();

    fireEvent.change(search, { target: { value: "sacerdotisa" } });
    expect(await screen.findByText("A Sacerdotisa", { selector: ".picker-hint strong" })).toBeInTheDocument();

    fireEvent.keyDown(search, { key: "Enter" });

    const registered = await screen.findByLabelText("Cartas já registradas");
    expect(within(registered).getByText("A Sacerdotisa")).toBeInTheDocument();
    expect(search).toHaveValue("");
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
  });

  it("guarda a tiragem em andamento e a retoma depois de recarregar", async () => {
    const first = render(<ReadingExperience spread={spread} />);
    const search = await advanceToSelection();
    fireEvent.change(search, { target: { value: "sacerdotisa" } });
    fireEvent.keyDown(search, { key: "Enter" });
    await screen.findByText("1 de 3");
    first.unmount();

    render(<ReadingExperience spread={spread} />);

    expect(await screen.findByText(/Retomamos esta tiragem de onde você parou/)).toBeInTheDocument();
    expect(screen.getByText(/1 carta registrada/)).toBeInTheDocument();
    const registered = await screen.findByLabelText("Cartas já registradas");
    expect(within(registered).getByText("A Sacerdotisa")).toBeInTheDocument();
  });

  it("recomeça do zero e descarta o rascunho guardado", async () => {
    const first = render(<ReadingExperience spread={spread} />);
    const search = await advanceToSelection();
    fireEvent.change(search, { target: { value: "sacerdotisa" } });
    fireEvent.keyDown(search, { key: "Enter" });
    await screen.findByText("1 de 3");
    first.unmount();

    render(<ReadingExperience spread={spread} />);
    fireEvent.click(await screen.findByRole("button", { name: "Recomeçar" }));

    const textarea = await screen.findByRole("textbox", { name: /pergunta aberta/i });
    expect(textarea).toHaveValue("");
    await waitFor(() => expect(window.localStorage.getItem("limiar:reading-draft:v1")).not.toContain("sacerdotisa"));
  });

  it("permite voltar a uma etapa já concluída pelo indicador de progresso", async () => {
    render(<ReadingExperience spread={spread} />);
    await advanceToSelection();

    fireEvent.click(screen.getByRole("button", { name: "Voltar para Pergunta" }));

    const textarea = await screen.findByRole("textbox", { name: /pergunta aberta/i });
    expect(textarea).toHaveValue(question);
  });

  it("preserva as cartas já registradas ao corrigir a pergunta", async () => {
    render(<ReadingExperience spread={spread} />);
    const search = await advanceToSelection();
    fireEvent.change(search, { target: { value: "sacerdotisa" } });
    fireEvent.keyDown(search, { key: "Enter" });
    await screen.findByText("1 de 3");

    fireEvent.click(screen.getByRole("button", { name: "Voltar para Pergunta" }));
    fireEvent.click(await screen.findByRole("button", { name: /Preparar baralho físico/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Continuar o registro/i }));

    const registered = await screen.findByLabelText("Cartas já registradas");
    expect(within(registered).getByText("A Sacerdotisa")).toBeInTheDocument();
  });
});
