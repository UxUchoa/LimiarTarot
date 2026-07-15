import { z } from "zod";

export const InterpretationRequestSchema = z.object({
  question: z.string().trim().min(10).max(500),
  theme: z.enum(["general", "future", "career", "love"]),
  spreadId: z.string().min(1).max(80),
  cards: z.array(z.object({
    cardId: z.string().min(1).max(80),
    positionId: z.string().min(1).max(80),
  }).strict()).min(1).max(12),
}).strict();

export const AiInterpretationSchema = z.object({
  questionAnalysis: z.object({
    interpretedQuestion: z.string().trim().min(10).max(600),
    questionType: z.enum(["yes-no", "open", "decision", "forecast", "relationship", "self-knowledge", "other"]),
    complexity: z.enum(["simple", "moderate", "complex"]),
    topicRelation: z.string().trim().min(20).max(1200),
    spreadRelation: z.string().trim().min(20).max(1200),
  }).strict(),
  directAnswer: z.string().trim().min(4).max(2000),
  positions: z.array(z.object({
    positionId: z.string().min(1).max(80),
    cardId: z.string().min(1).max(80),
    interpretation: z.string().trim().min(50).max(5000),
    answerContribution: z.string().trim().min(20).max(1200),
  }).strict()).min(1).max(12),
  connections: z.array(z.object({
    cardIds: z.array(z.string().min(1).max(80)).min(2).max(12),
    interpretation: z.string().trim().min(60).max(4000),
  }).strict()).max(8),
  synthesis: z.string().trim().min(100).max(8000),
  reflectionQuestions: z.array(z.string().trim().min(15).max(500)).min(1).max(5),
}).strict();

function toOllamaSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toOllamaSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["$schema", "minLength", "maxLength", "minItems", "maxItems"].includes(key))
      .map(([key, child]) => [key, toOllamaSchema(child)]),
  );
}

// O Ollama transforma o schema em uma gramática. Restrições de tamanho do
// draft 2020-12 ainda não são aceitas pelo parser; elas continuam obrigatórias
// na validação Zod aplicada depois da geração.
export const interpretationJsonSchema = toOllamaSchema(z.toJSONSchema(AiInterpretationSchema));

export type InterpretationRequest = z.infer<typeof InterpretationRequestSchema>;
