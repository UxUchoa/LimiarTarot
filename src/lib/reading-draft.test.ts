import { afterEach, describe, expect, it, vi } from "vitest";
import { clearDraft, readDraft, writeDraft } from "./reading-draft";

const draft = {
  question: "O que preciso compreender sobre esta mudança?",
  theme: "general" as const,
  selected: ["a-sacerdotisa", "o-imperador"],
  customCardCount: 3,
  stage: "select" as const,
};

afterEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("rascunho da tiragem", () => {
  it("devolve a tiragem interrompida da mesma modalidade", () => {
    writeDraft("linha-do-tempo", draft);

    expect(readDraft("linha-do-tempo")).toMatchObject(draft);
  });

  it("mantém rascunhos separados por modalidade", () => {
    writeDraft("linha-do-tempo", draft);
    writeDraft("cruz-celta", { ...draft, question: "Outra pergunta completamente diferente." });

    expect(readDraft("linha-do-tempo")?.question).toBe(draft.question);
    expect(readDraft("cruz-celta")?.question).toBe("Outra pergunta completamente diferente.");
  });

  it("descarta rascunho com mais de 24 horas", () => {
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);
    writeDraft("linha-do-tempo", draft);

    vi.spyOn(Date, "now").mockReturnValue(start + 24 * 60 * 60 * 1000 + 1);

    expect(readDraft("linha-do-tempo")).toBeNull();
  });

  it("remove apenas a modalidade pedida", () => {
    writeDraft("linha-do-tempo", draft);
    writeDraft("cruz-celta", draft);

    clearDraft("linha-do-tempo");

    expect(readDraft("linha-do-tempo")).toBeNull();
    expect(readDraft("cruz-celta")).not.toBeNull();
  });

  it("ignora conteúdo corrompido em vez de quebrar a tiragem", () => {
    window.localStorage.setItem("limiar:reading-draft:v1", "{isso não é json");
    expect(readDraft("linha-do-tempo")).toBeNull();

    window.localStorage.setItem("limiar:reading-draft:v1", JSON.stringify({ "linha-do-tempo": { question: 5 } }));
    expect(readDraft("linha-do-tempo")).toBeNull();
  });
});
