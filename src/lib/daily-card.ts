const DAY_MS = 86_400_000;
const DAILY_STEP = 31;
const DAILY_OFFSET = 17;

export function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function dailyCardIndex(date: Date, cardCount: number): number {
  if (!Number.isInteger(cardCount) || cardCount <= 0) {
    throw new Error("A carta do dia exige um baralho com pelo menos uma carta.");
  }
  const value = (localDayNumber(date) * DAILY_STEP + DAILY_OFFSET) % cardCount;
  return value < 0 ? value + cardCount : value;
}

export function millisecondsUntilNextLocalDay(date: Date): number {
  const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return Math.max(1_000, nextDay.getTime() - date.getTime() + 1_000);
}
