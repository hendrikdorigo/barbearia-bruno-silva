import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://barbearia-bruno-silva.vercel.app";

// Só as páginas públicas de fato (institucionais/marketing). Painel, login,
// agendamento em andamento etc. ficam de fora — não têm valor de busca e já
// são bloqueadas em robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const paginas = ["", "/servicos", "/barbeiros", "/loja", "/comunidade", "/privacidade"];

  return paginas.map((caminho) => ({
    url: `${siteUrl}${caminho}`,
    lastModified: new Date(),
    changeFrequency: caminho === "" ? "weekly" : "monthly",
    priority: caminho === "" ? 1 : 0.6,
  }));
}
