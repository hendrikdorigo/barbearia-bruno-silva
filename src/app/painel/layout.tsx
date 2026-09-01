import type { Metadata } from "next";

// Área logada — nunca deve aparecer no Google nem gerar preview ao
// compartilhar o link (não tem card de OG próprio nem sentido público).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
