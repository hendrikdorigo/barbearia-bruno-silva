"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgendamentoStepper({
  passos,
  atual,
}: {
  passos: { id: string; label: string }[];
  atual: string;
}) {
  if (!passos.some((p) => p.id === atual)) return null;
  const indexAtual = passos.findIndex((p) => p.id === atual);
  return (
    <div className="mt-6 flex items-center gap-2">
      {passos.map((p, i) => (
        <div key={p.id} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
              i < indexAtual && "border-gold bg-gold text-ink",
              i === indexAtual && "border-gold text-gold",
              i > indexAtual && "border-border text-muted-foreground"
            )}
          >
            {i < indexAtual ? <CheckIcon className="size-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              "hidden text-xs font-medium uppercase tracking-wider sm:inline",
              i <= indexAtual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {p.label}
          </span>
          {i < passos.length - 1 && (
            <span className={cn("h-px flex-1", i < indexAtual ? "bg-gold" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}
