import type { Metadata } from "next";
import { ReadingResult } from "@/components/readings/reading-result";

export const metadata: Metadata = { title: "Resultado da tiragem", robots: { index: false, follow: false } };
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <section className="section-shell"><ReadingResult id={id} /></section>; }
