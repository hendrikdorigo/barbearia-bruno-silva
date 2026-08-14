"use client";

export default function ConectarGoogleCalendar({ conectado }: { conectado: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-ink-soft p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Google Calendar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {conectado
            ? "Sua conta está conectada. Novos agendamentos confirmados criam eventos automaticamente."
            : "Conecte sua conta Google para que seus agendamentos confirmados criem eventos automaticamente na sua agenda."}
        </p>
      </div>
      <a
        href="/api/google/connect"
        className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest ${
          conectado
            ? "border border-green-500/40 text-success"
            : "bg-gold-gradient text-ink"
        }`}
      >
        {conectado ? "Conectado" : "Conectar"}
      </a>
    </div>
  );
}
