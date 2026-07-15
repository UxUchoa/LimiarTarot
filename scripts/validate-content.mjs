import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cards = JSON.parse(fs.readFileSync(path.join(root, "src/data/tarot-cards.json"), "utf8"));
const spreads = JSON.parse(fs.readFileSync(path.join(root, "src/data/tarot-spreads.json"), "utf8"));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(cards.length === 78, `Esperadas 78 cartas; recebidas ${cards.length}`);
assert(new Set(cards.map((card) => card.id)).size === 78, "IDs duplicados");
assert(new Set(cards.map((card) => card.slug)).size === 78, "Slugs duplicados");
assert(cards.filter((card) => card.arcanaType === "major").length === 22, "Arcanos Maiores inválidos");
assert(cards.filter((card) => card.arcanaType === "minor").length === 56, "Arcanos Menores inválidos");
for (const suit of ["cups", "pentacles", "swords", "wands"]) {
  assert(cards.filter((card) => card.suit === suit).length === 14, `Naipe ${suit} inválido`);
}
for (const card of cards) {
  for (const theme of ["general", "future"]) {
    assert(card.meanings[theme]?.trim().length > 20, `${card.name}: significado ${theme} ausente`);
  }
  if (card.reviewStatus === "approved") {
    for (const theme of ["career", "love"]) {
      assert(card.meanings[theme]?.trim().length > 20, `${card.name}: significado ${theme} ausente`);
    }
  }
  assert(card.source.originalText.length > 0, `${card.name}: fonte ausente`);
  assert(fs.existsSync(path.join(root, "public", card.image)), `${card.name}: imagem ausente`);
  assert(fs.existsSync(path.join(root, "public", card.thumbnail)), `${card.name}: thumbnail ausente`);
}
assert(spreads.length === 8, "Esperadas oito modalidades de tiragem");
assert(spreads.find((spread) => spread.id === "carta-unica")?.cardCount === 1, "Tiragem de carta única ausente");
assert(spreads.find((spread) => spread.id === "duas-cartas")?.cardCount === 2, "Tiragem de duas cartas ausente");
const customSpread = spreads.find((spread) => spread.id === "cartas-que-saltaram");
assert(customSpread?.kind === "custom" && customSpread.minCardCount === 4 && customSpread.maxCardCount === 12, "Tiragem personalizada inválida");
for (const spread of spreads) {
  assert(spread.positions.length === spread.cardCount, `${spread.name}: quantidade de posições inválida`);
  assert(new Set(spread.positions.map((position) => position.id)).size === spread.cardCount, `${spread.name}: posições duplicadas`);
}
console.log(`Conteúdo validado: ${cards.length} cartas e ${spreads.length} tiragens.`);
