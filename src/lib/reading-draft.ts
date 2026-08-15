import type { TarotTheme } from "@/types/tarot";

const DRAFT_KEY = "limiar:reading-draft:v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type ReadingStage = "configure" | "prepare" | "select" | "review";

export type ReadingDraft = {
  question: string;
  theme: TarotTheme;
  selected: string[];
  customCardCount: number;
  stage: ReadingStage;
  updatedAt: number;
};

type DraftMap = Record<string, ReadingDraft>;

function isDraft(value: unknown): value is ReadingDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<ReadingDraft>;
  return typeof draft.question === "string"
    && typeof draft.theme === "string"
    && Array.isArray(draft.selected)
    && draft.selected.every((item) => typeof item === "string")
    && typeof draft.customCardCount === "number"
    && (draft.stage === "configure" || draft.stage === "prepare" || draft.stage === "select" || draft.stage === "review")
    && typeof draft.updatedAt === "number";
}

function readAll(): DraftMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, draft]) => isDraft(draft) && now - draft.updatedAt < MAX_AGE_MS),
    ) as DraftMap;
  } catch {
    return {};
  }
}

/** Rascunho ainda válido da tiragem, ou `null` quando não há nada a retomar. */
export function readDraft(spreadId: string): ReadingDraft | null {
  return readAll()[spreadId] ?? null;
}

export function writeDraft(spreadId: string, draft: Omit<ReadingDraft, "updatedAt">): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readAll(), [spreadId]: { ...draft, updatedAt: Date.now() } }));
  } catch {
    /* rascunho é opcional: sem armazenamento, a tiragem apenas não é retomada */
  }
}

export function clearDraft(spreadId: string): void {
  try {
    const drafts = readAll();
    delete drafts[spreadId];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    /* idem */
  }
}
