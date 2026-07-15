"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { TarotCard } from "@/types/tarot";

export function HeroDeck({ cards }: { cards: TarotCard[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = ref.current;
    if (!visual) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(hover: none)").matches) return;

    let frame = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const animate = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      visual.style.setProperty("--tilt-x", `${current.y * -7}deg`);
      visual.style.setProperty("--tilt-y", `${current.x * 10}deg`);
      visual.style.setProperty("--shift-x", `${current.x * 14}px`);
      visual.style.setProperty("--shift-y", `${current.y * 10}px`);
      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        frame = requestAnimationFrame(animate);
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(animate); };
    const onMove = (event: PointerEvent) => {
      const rect = visual.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      schedule();
    };
    const onLeave = () => { target.x = 0; target.y = 0; schedule(); };

    visual.addEventListener("pointermove", onMove, { passive: true });
    visual.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      visual.removeEventListener("pointermove", onMove);
      visual.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="hero-visual" aria-label="Leque com quatro cartas do Tarô Rider-Waite">
      <div className="hero-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-deck">
        {cards.map((card, index) => (
          <div className="hero-card" key={card.id} style={{ "--enter-delay": `${180 + index * 60}ms`, "--float-delay": `${800 - index * 400}ms` } as React.CSSProperties}>
            <Image src={card.image} alt={`Carta ${card.name}`} fill priority sizes="210px" />
          </div>
        ))}
      </div>
      <div className="hero-sparks" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <span key={i} style={{ "--s": i } as React.CSSProperties} />)}</div>
    </div>
  );
}
