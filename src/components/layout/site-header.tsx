"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { History, LibraryBig, Menu, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { drawerVariants, overlayVariants, reducedVariants } from "@/lib/motion";
import { useHydratedReducedMotion } from "@/hooks/use-hydrated-reduced-motion";

const links = [
  ["Cartas", "/cartas", LibraryBig],
  ["Tiragens", "/tiragens", Sparkles],
  ["Guia", "/guia", Menu],
  ["Histórico", "/historico", History],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const reduceMotion = useHydratedReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const focusable = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onResize = () => { if (innerWidth > 920) setMenuOpen(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    addEventListener("resize", onResize);
    requestAnimationFrame(() => focusable()[0]?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      removeEventListener("resize", onResize);
      trigger?.focus();
    };
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="Limiar — página inicial">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span><strong>Limiar</strong><small>Tarô de Waite</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map(([label, href]) => {
            const active = pathname?.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                {label}
                {active && <motion.span className="desktop-nav-indicator" layoutId="desktop-nav-indicator" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <button
          ref={triggerRef}
          className="mobile-menu-trigger"
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? <X /> : <Menu />}</span>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu-layer">
            <motion.button
              className="mobile-menu-overlay"
              type="button"
              aria-label="Fechar menu"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              ref={drawerRef}
              id="mobile-navigation"
              className="mobile-menu-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navegação móvel"
              variants={reduceMotion ? reducedVariants : drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="mobile-menu-heading"><span>Navegação</span><button type="button" className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={18} /></button></div>
              <nav>
                {links.map(([label, href, Icon]) => {
                  const active = pathname?.startsWith(href);
                  return <Link className={active ? "active" : ""} aria-current={active ? "page" : undefined} key={href} href={href} onClick={() => setMenuOpen(false)}><Icon size={18} aria-hidden="true" /><span>{label}</span><span className="mobile-nav-arrow" aria-hidden="true">→</span></Link>;
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
