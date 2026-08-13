import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopupDisplay from "@/components/PopupDisplay";

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

export const metadata: Metadata = {
  title: "Bruno Silva Barbearia",
  description:
    "Cortes de cabelo e barba com excelência. Agende seu horário na Bruno Silva Barbearia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen flex flex-col bg-ink text-neutral-100 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <PopupDisplay />
      </body>
    </html>
  );
}
