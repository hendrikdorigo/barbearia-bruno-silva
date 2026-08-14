import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Barbearia Bruno Silva",
  description:
    "Cortes de cabelo e barba com excelência. Agende seu horário na Barbearia Bruno Silva.",
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
