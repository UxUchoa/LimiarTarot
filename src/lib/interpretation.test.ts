import { describe, expect, it, vi } from "vitest";
import {
  buildCanonicalInterpretationContext,
  buildInterpretationMessages,
  generateOllamaInterpretation,
  InterpretationServiceError,
  validateInterpretationAgainstContext,
} from "./ollama-interpretation";
import {
  estimatedInterpretationProgress,
  initialInterpretationEstimate,
  interpretationPhase,
  updateInterpretationEstimate,
} from "./interpretation-timing";
import { tarotCards, tarotSpreads } from "./tarot";
import type { AiInterpretation } from "@/types/interpretation";

const spread = tarotSpreads.find((item) => item.cardCount === 3)!;
const cards = tarotCards.slice(0, 3);
const request = {
  question: "O que preciso compreender sobre minha carreira neste momento?",
  theme: "career" as const,
  spreadId: spread.id,
  cards: spread.positions.map((position, index) => ({ cardId: cards[index].id, positionId: position.id })),
};

function validInterpretation(): AiInterpretation {
  return {
    questionAnalysis: {
      interpretedQuestion: "Compreender quais fatores profissionais merecem atenção neste momento.",
      questionType: "open",
      complexity: "moderate",
      topicRelation: "O tema Carreira direciona os significados das cartas para escolhas, recursos e condições profissionais.",
      spreadRelation: "A Linha do Tempo relaciona as influências passadas, o cenário presente e a tendência futura à pergunta profissional.",
    },
    directAnswer: "O momento pede que você reconheça os recursos já construídos e observe com cuidado a direção que está escolhendo para a carreira.",
    positions: request.cards.map((item, index) => ({
      ...item,
      interpretation: `Na posição ${index + 1}, a carta oferece uma perspectiva simbólica sustentada pelos significados documentados, sem transformar a leitura em previsão absoluta ou aconselhamento profissional.`,
      answerContribution: `Esta posição acrescenta à resposta o aspecto profissional representado pela etapa ${index + 1} da Linha do Tempo.`,
    })),
    connections: [{
      cardIds: [cards[0].id, cards[1].id],
      interpretation: "A relação entre as duas cartas sugere observar continuidade e contraste entre as condições descritas nas posições, como uma inferência reflexiva.",
    }],
    synthesis: "O conjunto propõe uma observação cuidadosa das influências representadas pelas três posições. A síntese permanece vinculada aos significados fornecidos e apresenta possibilidades de reflexão, sem assegurar acontecimentos futuros nem substituir decisões profissionais responsáveis.",
    reflectionQuestions: [
      "Que aspecto desta leitura encontra correspondência concreta na situação atual?",
      "Qual atitude pode ser observada com mais cuidado antes de uma decisão?",
    ],
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("contexto canônico da interpretação", () => {
  it("reconstrói somente as cartas selecionadas e somente o tema solicitado", () => {
    const context = buildCanonicalInterpretationContext(request);
    expect(context.cards.map((item) => item.cardId)).toEqual(cards.map((card) => card.id));
    expect(context.cards).toHaveLength(3);
    expect(context.cards[0].thematicMeaning).toBe(cards[0].meanings.career);
    expect(JSON.stringify(context)).not.toContain(tarotCards[20].source.originalText);
    const systemPrompt = buildInterpretationMessages(context)[0].content;
    expect(systemPrompt).toContain("cartas invertidas");
    expect(systemPrompt).toContain("directAnswer deve começar");
    expect(systemPrompt).toContain("Uma pergunta simples deve receber uma resposta simples");
    expect(systemPrompt).toContain("tema selecionado como lente interpretativa");
    expect(systemPrompt).toContain("função específica da modalidade");
  });

  it("rejeita repetição, quantidade e ordem de posições inválidas", () => {
    expect(() => buildCanonicalInterpretationContext({ ...request, cards: request.cards.slice(0, 2) })).toThrow(InterpretationServiceError);
    expect(() => buildCanonicalInterpretationContext({ ...request, cards: request.cards.map((item) => ({ ...item, cardId: cards[0].id })) })).toThrow(/mesma carta/i);
    expect(() => buildCanonicalInterpretationContext({ ...request, cards: [...request.cards].reverse() })).toThrow(/posições canônicas/i);
  });

  it("rejeita cartas inventadas ou posições reordenadas na resposta", () => {
    const context = buildCanonicalInterpretationContext(request);
    const result = validInterpretation();
    expect(() => validateInterpretationAgainstContext(result, context)).not.toThrow();
    result.positions[0].cardId = "carta-inventada";
    expect(() => validateInterpretationAgainstContext(result, context)).toThrow(/associou cartas/i);
  });

  it("exige uma resposta direta quando a pergunta for de sim ou não", () => {
    const context = buildCanonicalInterpretationContext({ ...request, question: "Devo tomar uma decisão agora?", theme: "general" });
    const result = validInterpretation();
    result.questionAnalysis.questionType = "yes-no";
    result.directAnswer = "As cartas apresentam diferentes aspectos para reflexão.";
    expect(() => validateInterpretationAgainstContext(result, context)).toThrow(/não respondeu diretamente/i);
    result.directAnswer = "Mais para sim, porque o conjunto favorece uma ação consciente.";
    expect(() => validateInterpretationAgainstContext(result, context)).not.toThrow();
  });

  it("valida carta única sem conexões inventadas", () => {
    const singleSpread = tarotSpreads.find((item) => item.id === "carta-unica")!;
    const singleRequest = {
      question: "Qual mensagem merece minha atenção hoje?",
      theme: "general" as const,
      spreadId: singleSpread.id,
      cards: [{ cardId: tarotCards[0].id, positionId: singleSpread.positions[0].id }],
    };
    const context = buildCanonicalInterpretationContext(singleRequest);
    const result = validInterpretation();
    result.positions = [{
      cardId: tarotCards[0].id,
      positionId: singleSpread.positions[0].id,
      interpretation: "A carta única concentra a leitura em uma mensagem central diretamente relacionada à pergunta formulada.",
      answerContribution: "Este é o símbolo central e suficiente desta leitura.",
    }];
    result.connections = [];
    expect(buildInterpretationMessages(context)[0].content).toContain("connections deve ser uma lista vazia");
    expect(() => validateInterpretationAgainstContext(result, context)).not.toThrow();
    result.connections = [{ cardIds: [tarotCards[0].id, tarotCards[0].id], interpretation: "Conexão inválida repetindo a mesma carta em uma leitura de carta única." }];
    expect(() => validateInterpretationAgainstContext(result, context)).toThrow(/não pode inventar conexões/i);
  });

  it("mantém a ordem e pede uma conexão na tiragem de duas cartas", () => {
    const doubleSpread = tarotSpreads.find((item) => item.id === "duas-cartas")!;
    const doubleRequest = {
      question: "Como estas duas mensagens se complementam?",
      theme: "general" as const,
      spreadId: doubleSpread.id,
      cards: [
        { cardId: tarotCards[0].id, positionId: "mensagem-principal" },
        { cardId: tarotCards[1].id, positionId: "complemento" },
      ],
    };
    const context = buildCanonicalInterpretationContext(doubleRequest);
    expect(context.cards.map((item) => item.positionId)).toEqual(["mensagem-principal", "complemento"]);
    expect(buildInterpretationMessages(context)[0].content).toContain("produza uma conexão entre elas");
  });

  it("reconstrói posições dinâmicas para cinco cartas que saltaram", () => {
    const cardsThatJumped = tarotCards.slice(0, 5);
    const customRequest = {
      question: "O que esta sequência espontânea quer mostrar?",
      theme: "future" as const,
      spreadId: "cartas-que-saltaram",
      cards: cardsThatJumped.map((card, index) => ({ cardId: card.id, positionId: `salto-${index + 1}` })),
    };
    const context = buildCanonicalInterpretationContext(customRequest);
    expect(context.cards).toHaveLength(5);
    expect(context.cards.map((item) => item.positionId)).toEqual(["salto-1", "salto-2", "salto-3", "salto-4", "salto-5"]);
    expect(context.spread.name).toBe("Cartas que saltaram");
  });
});

describe("estimativa de duração", () => {
  it("usa sessenta segundos ou quinze segundos por carta", () => {
    expect(initialInterpretationEstimate(3)).toBe(60);
    expect(initialInterpretationEstimate(12)).toBe(180);
  });

  it("atualiza por média móvel e limita a barra a 92%", () => {
    expect(updateInterpretationEstimate(60, 100)).toBe(74);
    expect(estimatedInterpretationProgress(10000, 60)).toBe(92);
    expect(interpretationPhase(0)).toBe("validating");
    expect(interpretationPhase(2)).toBe("preparing");
    expect(interpretationPhase(5)).toBe("interpreting");
  });
});

describe("cliente Ollama", () => {
  it("aceita uma saída estruturada válida", async () => {
    const interpretation = validInterpretation();
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ models: [{ name: "gemma3:12b" }] }))
      .mockResolvedValueOnce(jsonResponse({ message: { content: JSON.stringify(interpretation) }, total_duration: 2_000_000_000 }));
    const result = await generateOllamaInterpretation(request, { fetchImpl, baseUrl: "http://ollama.test" });
    expect(result.interpretation).toEqual(interpretation);
    expect(result.durationMs).toBe(2000);
    const payload = JSON.parse(fetchImpl.mock.calls[1][1].body as string);
    expect(payload.model).toBe("gemma3:12b");
    expect(payload.stream).toBe(false);
    expect(payload.think).toBe(false);
    expect(payload.options.num_ctx).toBe(16384);
  });

  it("classifica modelo ausente, serviço indisponível e JSON inválido", async () => {
    const missing = vi.fn().mockResolvedValue(jsonResponse({ models: [] }));
    await expect(generateOllamaInterpretation(request, { fetchImpl: missing })).rejects.toMatchObject({ code: "MODEL_NOT_INSTALLED" });

    const unavailable = vi.fn().mockRejectedValue(new TypeError("connection refused"));
    await expect(generateOllamaInterpretation(request, { fetchImpl: unavailable })).rejects.toMatchObject({ code: "OLLAMA_UNAVAILABLE" });

    const invalid = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ models: [{ name: "gemma3:12b" }] }))
      .mockResolvedValueOnce(jsonResponse({ message: { content: "não é json" } }));
    await expect(generateOllamaInterpretation(request, { fetchImpl: invalid })).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("propaga cancelamento e timeout", async () => {
    const waitForAbort = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })) as typeof fetch;
    await expect(generateOllamaInterpretation(request, { fetchImpl: waitForAbort, timeoutMs: 5 })).rejects.toMatchObject({ code: "TIMEOUT" });

    const controller = new AbortController();
    const pending = generateOllamaInterpretation(request, { fetchImpl: waitForAbort, signal: controller.signal, timeoutMs: 1000 });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "CANCELLED" });
  });
});
