import { NextResponse } from "next/server";
import { generateOllamaInterpretation, InterpretationServiceError } from "@/lib/ollama-interpretation";
import { DEFAULT_OLLAMA_MODEL, isSupportedOllamaModel, OLLAMA_MODELS } from "@/lib/ollama-models";
import type { InterpretationFailure, OllamaModelsResponse } from "@/types/interpretation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ollamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
}

function configuredDefaultModel() {
  return isSupportedOllamaModel(process.env.OLLAMA_MODEL) ? process.env.OLLAMA_MODEL : DEFAULT_OLLAMA_MODEL;
}

export async function GET() {
  const base = ollamaBaseUrl();
  const defaultModel = configuredDefaultModel();
  try {
    const response = await fetch(`${base}/api/tags`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`Ollama respondeu ${response.status}`);
    const payload = await response.json() as { models?: Array<{ name?: string; model?: string }> };
    const installed = new Set((payload.models ?? []).flatMap((item) => [item.name, item.model]).filter((name): name is string => Boolean(name)));
    const result: OllamaModelsResponse = {
      ok: true,
      available: true,
      defaultModel,
      models: OLLAMA_MODELS.map((model) => ({ ...model, installed: installed.has(model.id) })),
    };
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    const result: OllamaModelsResponse = {
      ok: true,
      available: false,
      defaultModel,
      models: OLLAMA_MODELS.map((model) => ({ ...model, installed: false })),
      message: "O Ollama local não está respondendo.",
    };
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await generateOllamaInterpretation(body, { signal: request.signal });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const known = error instanceof InterpretationServiceError
      ? error
      : new InterpretationServiceError("INVALID_READING", "Não foi possível processar esta leitura.", 400);
    const response: InterpretationFailure = { ok: false, error: { code: known.code, message: known.message } };
    return NextResponse.json(response, { status: known.status, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { model?: unknown };
    if (!isSupportedOllamaModel(body.model)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_READING", message: "Modelo não suportado pelo Limiar." } },
        { status: 400 },
      );
    }

    const response = await fetch(`${ollamaBaseUrl()}/api/pull`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: body.model, stream: true }),
      signal: request.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.text();
      return NextResponse.json(
        { ok: false, error: { code: "OLLAMA_UNAVAILABLE", message: detail || "Não foi possível instalar o modelo." } },
        { status: response.status || 502 },
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { ok: false, error: { code: "CANCELLED", message: "Instalação cancelada." } },
        { status: 499 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "OLLAMA_UNAVAILABLE", message: "Não foi possível acessar o Ollama local." } },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { model?: unknown };
    if (!isSupportedOllamaModel(body.model)) {
      return NextResponse.json({ ok: false, error: { code: "INVALID_READING", message: "Modelo não suportado pelo Limiar." } }, { status: 400 });
    }
    const response = await fetch(`${ollamaBaseUrl()}/api/delete`, {
      method: "DELETE",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: body.model }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ ok: false, error: { code: "OLLAMA_UNAVAILABLE", message: detail || "Não foi possível remover o modelo." } }, { status: response.status });
    }
    return NextResponse.json({ ok: true, model: body.model }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "OLLAMA_UNAVAILABLE", message: "Não foi possível acessar o Ollama local." } }, { status: 503 });
  }
}
