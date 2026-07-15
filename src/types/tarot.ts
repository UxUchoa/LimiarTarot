export type ArcanaType = "major" | "minor";
export type TarotTheme = "general" | "future" | "career" | "love";
export type TarotSuit = "cups" | "pentacles" | "swords" | "wands";
export type TarotElement = "water" | "earth" | "air" | "fire";
export type CourtRank = "page" | "knight" | "queen" | "king";

export interface TarotCard {
  id: string;
  slug: string;
  name: string;
  originalName?: string;
  number: number;
  deckOrder: number;
  arcanaType: ArcanaType;
  suit?: TarotSuit;
  element?: TarotElement;
  rank?: CourtRank;
  image: string;
  thumbnail: string;
  keywords: string[];
  archetype: string;
  summary: string;
  meanings: Record<TarotTheme, string>;
  symbolism: string[];
  source: {
    documentTitle: string;
    pageStart: number;
    pageEnd: number;
    originalText: string;
    normalizedText: string;
  };
  imageAttribution: {
    collection: string;
    fileName: string;
    sourceUrl: string;
    license: string;
    creator: string;
  };
  reviewStatus: "approved" | "needs-review";
}

export interface TarotSpreadPosition {
  id: string;
  order: number;
  name: string;
  description: string;
  x: number;
  y: number;
  rotation: number;
  orientation: "vertical" | "horizontal";
  compactOrder: number;
}

export interface TarotSpread {
  id: string;
  slug: string;
  name: string;
  description: string;
  cardCount: number;
  kind?: "fixed" | "custom";
  minCardCount?: number;
  maxCardCount?: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  recommendedFor: string[];
  positions: TarotSpreadPosition[];
}

export interface ReadingCard {
  cardId: string;
  positionId: string;
}

export interface ReadingSession {
  schemaVersion: 2;
  id: string;
  question: string;
  theme: TarotTheme;
  spreadId: string;
  mode: "physical" | "legacy-digital";
  physicalDeckConfirmed: boolean;
  cards: ReadingCard[];
  revealedCardIds: string[];
  summary: string;
  demonstrationCardId?: string;
  createdAt: string;
}

export interface CardFilters {
  query: string;
  arcanaTypes: ArcanaType[];
  suits: TarotSuit[];
  elements: TarotElement[];
  ranks: CourtRank[];
  numbers: number[];
  theme: TarotTheme;
  sort: "deck" | "name" | "number";
}
