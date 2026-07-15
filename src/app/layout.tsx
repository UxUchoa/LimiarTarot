import type { Metadata } from "next";
import localFont from "next/font/local";
import { CosmicCanvas } from "@/components/animations/cosmic-canvas";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../assets/fonts/cormorant-garamond-400.ttf", weight: "400" },
    { path: "../assets/fonts/cormorant-garamond-500.ttf", weight: "500" },
    { path: "../assets/fonts/cormorant-garamond-600.ttf", weight: "600" },
    { path: "../assets/fonts/cormorant-garamond-700.ttf", weight: "700" },
  ],
});

const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "../assets/fonts/manrope-400.ttf", weight: "400" },
    { path: "../assets/fonts/manrope-500.ttf", weight: "500" },
    { path: "../assets/fonts/manrope-600.ttf", weight: "600" },
    { path: "../assets/fonts/manrope-700.ttf", weight: "700" },
    { path: "../assets/fonts/manrope-800.ttf", weight: "800" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Limiar — Tarô de Waite", template: "%s | Limiar" },
  description: "Explore as 78 cartas do Tarô Rider-Waite e interprete no site as cartas que você retirou do seu baralho físico.",
  openGraph: { title: "Limiar — Tarô de Waite", description: "Tire as cartas com seu baralho físico e encontre no Limiar uma interpretação guiada pelo manual.", type: "website", locale: "pt_BR" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <CosmicCanvas />
        <ScrollReveal />
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
