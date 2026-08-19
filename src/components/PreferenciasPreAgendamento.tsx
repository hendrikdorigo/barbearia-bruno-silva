"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPCOES_FREQUENCIA = [
  { label: "2 semanas", dias: 14 },
  { label: "3 semanas", dias: 21 },
  { label: "1 mês", dias: 30 },
  { label: "45 dias", dias: 45 },
  { label: "2 meses", dias: 60 },
  { label: "Mais de 2 meses", dias: 90 },
];

export default function PreferenciasPreAgendamento({
  ativoInicial,
  frequenciaInicial,
}: {
  ativoInicial: boolean;
  frequenciaInicial: number | null;
}) {
  const supabase = createClient();
  const [ativo, setAtivo] = useState(ativoInicial);
  const [frequencia, setFrequencia] = useState<number | null>(frequenciaInicial);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function escolherFrequencia(dias: number) {
    setSalvando(true);
    setMensagem(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("clientes")
      .update({ frequencia_dias: dias, pre_agendamento_ativo: true })
      .eq("profile_id", user!.id);
    setSalvando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setFrequencia(dias);
    setAtivo(true);
    setMensagem("Pré-agendamento ativado.");
  }

  async function desativar() {
    setSalvando(true);
    setMensagem(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("clientes")
      .update({ pre_agendamento_ativo: false })
      .eq("profile_id", user!.id);
    setSalvando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setAtivo(false);
    setMensagem("Pré-agendamento desativado.");
  }

  return (
    <Card className="border-border bg-ink-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl font-normal tracking-wide">Pré-agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {ativo
            ? `Ativado - a cada ${OPCOES_FREQUENCIA.find((o) => o.dias === frequencia)?.label ?? `${frequencia} dias`}, te aviso por WhatsApp perto da data pra confirmar ou recusar o próximo horário.`
            : "Desativado. Ligue pra receber um aviso por WhatsApp perto da data provável do seu próximo corte."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OPCOES_FREQUENCIA.map((op) => (
            <button
              key={op.dias}
              disabled={salvando}
              onClick={() => escolherFrequencia(op.dias)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50",
                ativo && frequencia === op.dias
                  ? "border-gold bg-gold-gradient font-semibold text-ink"
                  : "border-border text-muted-foreground hover:border-gold hover:text-foreground"
              )}
            >
              {op.label}
            </button>
          ))}
        </div>

        {ativo && (
          <Button
            variant="outline"
            size="sm"
            disabled={salvando}
            onClick={desativar}
            className="mt-4 w-fit rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            Desativar
          </Button>
        )}

        {mensagem && <p className="mt-3 text-sm text-gold">{mensagem}</p>}
      </CardContent>
    </Card>
  );
}
