import { NextResponse } from "next/server";
import { generateOllamaInterpretation, InterpretationServiceError } from "@/lib/ollama-interpretation";
import type { InterpretationFailure } from "@/types/interpretation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
