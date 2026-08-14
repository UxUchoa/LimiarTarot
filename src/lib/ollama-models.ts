export const OLLAMA_MODEL_IDS = [
  "gemma3:4b",
  "qwen3.5:4b",
  "qwen3.5:9b",
  "gemma3:12b",
  "qwen3.5:27b",
  "gemma3:27b",
] as const;

export type OllamaModelId = typeof OLLAMA_MODEL_IDS[number];
export type OllamaModelTier = "leve" | "equilibrado" | "potente";

export interface OllamaModelDefinition {
  id: OllamaModelId;
  label: string;
  family: "Gemma 3" | "Qwen 3.5";
  size: string;
  context: string;
  tier: OllamaModelTier;
  recommendation: string;
  longReadingQuality: "básica" | "boa" | "alta";
}

export const DEFAULT_OLLAMA_MODEL: OllamaModelId = "gemma3:12b";
export const OLLAMA_MODEL_STORAGE_KEY = "limiar:ollama-model:v1";

export const OLLAMA_MODELS: readonly OllamaModelDefinition[] = [
  {
    id: "gemma3:4b",
    label: "Gemma 3 4B",
    family: "Gemma 3",
    size: "3,3 GB",
    context: "128K",
    tier: "leve",
    recommendation: "Máquinas modestas e leituras curtas; pode perder consistência perto de 12 cartas.",
    longReadingQuality: "básica",
  },
  {
    id: "qwen3.5:4b",
    label: "Qwen 3.5 4B",
    family: "Qwen 3.5",
    size: "3,4 GB",
    context: "256K",
    tier: "leve",
    recommendation: "Alternativa leve e moderna; prefira tiragens menores quando a máquina for limitada.",
    longReadingQuality: "básica",
  },
  {
    id: "qwen3.5:9b",
    label: "Qwen 3.5 9B",
    family: "Qwen 3.5",
    size: "6,6 GB",
    context: "256K",
    tier: "equilibrado",
    recommendation: "Melhor equilíbrio entre tamanho e qualidade para leituras de até 12 cartas.",
    longReadingQuality: "boa",
  },
  {
    id: "gemma3:12b",
    label: "Gemma 3 12B",
    family: "Gemma 3",
    size: "8,1 GB",
    context: "128K",
    tier: "equilibrado",
    recommendation: "Padrão do Limiar; boa aderência ao português e ao JSON estruturado em tiragens longas.",
    longReadingQuality: "boa",
  },
  {
    id: "qwen3.5:27b",
    label: "Qwen 3.5 27B",
    family: "Qwen 3.5",
    size: "17 GB",
    context: "256K",
    tier: "potente",
    recommendation: "Para hardware forte e maior capacidade de relacionar muitas posições.",
    longReadingQuality: "alta",
  },
  {
    id: "gemma3:27b",
    label: "Gemma 3 27B",
    family: "Gemma 3",
    size: "17 GB",
    context: "128K",
    tier: "potente",
    recommendation: "Maior qualidade da família Gemma para leituras densas em máquinas potentes.",
    longReadingQuality: "alta",
  },
] as const;

export function isSupportedOllamaModel(value: unknown): value is OllamaModelId {
  return typeof value === "string" && (OLLAMA_MODEL_IDS as readonly string[]).includes(value);
}

export function getOllamaModel(value: string): OllamaModelDefinition | undefined {
  return OLLAMA_MODELS.find((model) => model.id === value);
}

export function ollamaModelLabel(value: string): string {
  return getOllamaModel(value)?.label ?? value;
}
