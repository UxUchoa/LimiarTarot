import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ReadingResult } from "./reading-result";
import type { InterpretationSuccess } from "@/types/interpretation";
import type { ReadingSession } from "@/types/tarot";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span role="img" aria-label={alt || "Carta"} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("./spread-board", () => ({ SpreadBoard: () => <div data-testid="spread-board">Cartas da tiragem</div> }));

const session: ReadingSession = {
  schemaVersion: 2,
  id: "simple-reading",
  question: "devo tomar banho hj?",
  theme: "general",
  spreadId: "linha-do-tempo",
  mode: "physical",
  physicalDeckConfirmed: true,
  cards: [
    { cardId: "a-sacerdotisa", positionId: "p1" },
    { cardId: "o-imperador", positionId: "p2" },
    { cardId: "os-enamorados", positionId: "p3" },
  ],
  revealedCardIds: ["a-sacerdotisa", "o-imperador", "os-enamorados"],
  summary: "Leitura básica",
  createdAt: "2026-07-15T12:00:00.000Z",
};

const response: InterpretationSuccess = {
  ok: true,
  model: "gemma3:12b",
  durationMs: 12000,
  interpretation: {
    questionAnalysis: {
      interpretedQuestion: "A pessoa quer saber se deve tomar banho hoje.",
      questionType: "yes-no",
      complexity: "simple",
      topicRelation: "O tema Geral mantém o sentido cotidiano e literal da pergunta.",
      spreadRelation: "A Linha do Tempo conecta passado, presente e tendência à decisão de hoje.",
    },
    directAnswer: "Sim.",
    positions: session.cards.map((card, index) => ({
      ...card,
      interpretation: `A posição ${index + 1} relaciona a carta diretamente à decisão de tomar banho hoje.`,
      answerContribution: "Esta posição sustenta a resposta direta sem substituir o sentido da pergunta.",
    })),
    connections: [{ cardIds: ["a-sacerdotisa", "o-imperador"], interpretation: "O conjunto favorece uma ação simples e consciente no presente." }],
    synthesis: "As cartas favorecem tomar banho hoje; a leitura trata isso como uma decisão cotidiana, sem transformar a pergunta em um dilema abstrato.",
    reflectionQuestions: ["Como uma rotina simples pode contribuir para seu bem-estar hoje?"],
  },
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("resultado de uma pergunta simples", () => {
  it("mostra a resposta antes da análise e recolhe os detalhes extensos", async () => {
    window.localStorage.setItem("limiar:readings:v2", JSON.stringify([session]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    const { container } = render(<ReadingResult id={session.id} />);
    expect(await screen.findByRole("heading", { name: "Resposta à sua pergunta" })).toBeInTheDocument();
    expect(screen.getByText("Sim.")).toBeInTheDocument();
    expect(screen.getByText(response.interpretation.synthesis)).toBeInTheDocument();

    const details = container.querySelector(".simple-reading-details");
    expect(details).toBeInstanceOf(HTMLDetailsElement);
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("Ver cartas, posições e evidências do manual")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });
});
