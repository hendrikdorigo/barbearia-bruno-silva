import type { Config } from "@netlify/functions";

// Roda a cada 10 minutos. Dispara o envio dos lembretes de WhatsApp pendentes
// (fila em `lembretes_whatsapp`) chamando a rota interna /api/cron/lembretes.
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!siteUrl || !secret) return;

  await fetch(`${siteUrl}/api/cron/lembretes`, {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });
};

export const config: Config = {
  schedule: "*/10 * * * *",
};
