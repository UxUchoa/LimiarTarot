export type InterpretationErrorCode =
  | "OLLAMA_UNAVAILABLE"
  | "MODEL_NOT_INSTALLED"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "INVALID_READING"
  | "CANCELLED";

export interface AiPositionInterpretation {
  positionId: string;
  cardId: string;
  interpretation: string;
  answerContribution: string;
}

export interface AiConnectionInterpretation {
  cardIds: string[];
  interpretation: string;
}

export interface AiInterpretation {
  questionAnalysis: {
    interpretedQuestion: string;
    questionType: "yes-no" | "open" | "decision" | "forecast" | "relationship" | "self-knowledge" | "other";
    complexity: "simple" | "moderate" | "complex";
    topicRelation: string;
    spreadRelation: string;
  };
  directAnswer: string;
  positions: AiPositionInterpretation[];
  connections: AiConnectionInterpretation[];
  synthesis: string;
  reflectionQuestions: string[];
}

export interface InterpretationSuccess {
  ok: true;
  model: "gemma3:12b";
  durationMs: number;
  interpretation: AiInterpretation;
}

export interface InterpretationFailure {
  ok: false;
  error: {
    code: InterpretationErrorCode;
    message: string;
  };
}

export type InterpretationResponse = InterpretationSuccess | InterpretationFailure;
