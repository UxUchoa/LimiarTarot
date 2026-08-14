import { describe, expect, it } from "vitest";
import { dailyCardIndex, localDayNumber, millisecondsUntilNextLocalDay } from "./daily-card";

describe("carta do dia", () => {
  it("permanece igual durante todo o mesmo dia local", () => {
    const morning = new Date(2026, 7, 14, 0, 1);
    const evening = new Date(2026, 7, 14, 23, 59);
    expect(localDayNumber(morning)).toBe(localDayNumber(evening));
    expect(dailyCardIndex(morning, 78)).toBe(dailyCardIndex(evening, 78));
  });

  it("muda no dia seguinte", () => {
    const today = new Date(2026, 7, 14, 12);
    const tomorrow = new Date(2026, 7, 15, 12);
    expect(dailyCardIndex(today, 78)).not.toBe(dailyCardIndex(tomorrow, 78));
  });

  it("percorre as 78 cartas sem repetição antes de reiniciar o ciclo", () => {
    const start = new Date(2026, 0, 1, 12);
    const indexes = Array.from({ length: 78 }, (_, offset) => {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset, 12);
      return dailyCardIndex(day, 78);
    });
    expect(new Set(indexes).size).toBe(78);
  });

  it("calcula a próxima troca para depois da meia-noite", () => {
    const almostMidnight = new Date(2026, 7, 14, 23, 59, 59);
    expect(millisecondsUntilNextLocalDay(almostMidnight)).toBe(2_000);
  });
});
