import { expect, test } from "@playwright/test";

test("navega pela biblioteca e abre uma carta", async ({ page }) => {
  await page.goto("/cartas");
  await page.getByPlaceholder(/Busque/).fill("Sacerdotisa");
  await expect(page.getByText(/1 carta encontrada/)).toBeVisible();
  await page.getByRole("link", { name: /Conhecer A Sacerdotisa/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "A Sacerdotisa" })).toBeVisible();
});

test("registra uma tiragem feita com o baralho físico", async ({ page }) => {
  await page.goto("/tiragens/linha-do-tempo");
  await page.getByRole("textbox").fill("Como posso compreender melhor este momento da minha vida?");
  await page.getByRole("button", { name: /Preparar baralho físico/ }).click();
  await expect(page.getByRole("heading", { name: /Tire 3 cartas com as próprias mãos/ })).toBeVisible();
  await page.getByRole("button", { name: /Já tirei minhas cartas/ }).click();

  await page.getByRole("button", { name: "Selecionar O Louco para Passado" }).click();
  await page.getByRole("button", { name: "Selecionar O Mago para Presente" }).click();
  await page.getByRole("button", { name: "Selecionar A Sacerdotisa para Futuro ou tendência" }).click();

  await expect(page.getByRole("heading", { name: /Estas são as cartas da sua mesa física/ })).toBeVisible();
  await page.getByRole("button", { name: /Gerar interpretação/ }).click();
  await expect(page.getByText(/Cartas retiradas do baralho físico/)).toBeVisible();
  await expect(page.getByText(/Síntese estruturada/)).toBeVisible();
});

test("salva no histórico a sequência registrada do baralho físico", async ({ page }) => {
  await page.goto("/tiragens/aconselhamento");
  await page.getByRole("textbox").fill("Quais fatores devo observar antes de tomar esta decisão?");
  await page.getByRole("button", { name: /Preparar baralho físico/ }).click();
  await page.getByRole("button", { name: /Já tirei minhas cartas/ }).click();
  await page.getByRole("button", { name: /Selecionar O Louco para Situação base/ }).click();
  await page.getByRole("button", { name: /Selecionar O Mago para Bloqueio ou desafio/ }).click();
  await page.getByRole("button", { name: /Selecionar A Sacerdotisa para Conselho/ }).click();
  await page.getByRole("button", { name: /Gerar interpretação/ }).click();
  await page.goto("/historico");
  await expect(page.getByText(/Quais fatores devo observar/)).toBeVisible();
  await expect(page.getByText("Baralho físico")).toBeVisible();
});
