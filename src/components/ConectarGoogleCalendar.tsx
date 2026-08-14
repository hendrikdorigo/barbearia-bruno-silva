"use client";

import { CalendarCheckIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ConectarGoogleCalendar({ conectado }: { conectado: boolean }) {
  return (
    <Card className="mt-8 flex-row items-center justify-between gap-4 border-border bg-ink-soft p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarCheckIcon className="size-4 text-gold" />
          Google Calendar
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {conectado
            ? "Sua conta está conectada. Novos agendamentos confirmados criam eventos automaticamente."
            : "Conecte sua conta Google para que seus agendamentos confirmados criem eventos automaticamente na sua agenda."}
        </p>
      </div>
      <a
        href="/api/google/connect"
        className={cn(
          "shrink-0 rounded-full uppercase tracking-widest",
          conectado
            ? buttonVariants({ variant: "outline", size: "sm" }) + " border-success/40 text-success"
            : buttonVariants({ size: "sm" })
        )}
      >
        {conectado ? "Conectado" : "Conectar"}
      </a>
    </Card>
  );
}
