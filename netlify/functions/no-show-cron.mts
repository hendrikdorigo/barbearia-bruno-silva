import type { Config } from "@netlify/functions";

// Roda a cada 5 minutos. Cancela automaticamente agendamentos com mais de
// 15 minutos de atraso (tolerância) chamando /api/cron/no-show.
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!siteUrl || !secret) return;

  await fetch(`${siteUrl}/api/cron/no-show`, {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
