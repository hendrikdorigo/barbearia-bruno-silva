import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopupDisplay from "@/components/PopupDisplay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

// Troque para o domínio próprio assim que o Bruno registrar um (basta
// configurar NEXT_PUBLIC_SITE_URL no projeto da Vercel, sem mexer no código).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://barbearia-bruno-silva.vercel.app";

const titulo = "Barbearia Bruno Silva — Cortes e Barba em Limeira/SP";
const descricao =
  "Agende online seu corte de cabelo ou barba na Barbearia Bruno Silva, em Limeira/SP. Horários flexíveis, profissionais experientes e pagamento pelo site.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titulo,
    template: "%s | Barbearia Bruno Silva",
  },
  description: descricao,
  keywords: [
    "barbearia Limeira",
    "corte de cabelo Limeira",
    "barba Limeira",
    "agendar barbearia online",
    "Barbearia Bruno Silva",
  ],
  authors: [{ name: "Barbearia Bruno Silva" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Barbearia Bruno Silva",
    title: titulo,
    description: descricao,
    images: [
      {
        url: "/logo-full.png",
        width: 1191,
        height: 1049,
        alt: "Barbearia Bruno Silva",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descricao,
    images: ["/logo-full.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={cn(display.variable, body.variable, serif.variable, mono.variable)}
    >
      <body className="flex min-h-screen flex-col">
        <TooltipProvider delayDuration={150}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <PopupDisplay />
          <Toaster theme="dark" position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
