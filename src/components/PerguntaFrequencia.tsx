"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OPCOES_FREQUENCIA = [
  { label: "2 semanas", dias: 14 },
  { label: "3 semanas", dias: 21 },
  { label: "1 mês", dias: 30 },
  { label: "45 dias", dias: 45 },
  { label: "2 meses", dias: 60 },
  { label: "Mais de 2 meses", dias: 90 },
];

/**
 * Pergunta mostrada na tela de sucesso de cada agendamento enquanto o
 * cliente não tiver `frequencia_dias` definida (chamador só renderiza esse
 * componente nesse caso) - "Não sei dizer" não grava nada, então ela volta
 * a aparecer no próximo agendamento. Assim que o cliente responde com uma
 * frequência (aqui ou em Minha Conta), para de aparecer; ligar/desligar ou
 * trocar depois disso só é feito em Minha Conta (PreferenciasPreAgendamento.tsx).
 */
export default function PerguntaFrequencia({ clienteId }: { clienteId: string }) {
  const supabase = createClient();
  const [etapa, setEtapa] = useState<"pergunta1" | "pergunta2" | "concluido" | "dispensado">("pergunta1");
  const [frequenciaEscolhida, setFrequenciaEscolhida] = useState<{ label: string; dias: number } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ativou, setAtivou] = useState(false);

  async function escolherFrequencia(opcao: { label: string; dias: number }) {
    setFrequenciaEscolhida(opcao);
    setSalvando(true);
    await supabase.from("clientes").update({ frequencia_dias: opcao.dias }).eq("profile_id", clienteId);
    setSalvando(false);
    setEtapa("pergunta2");
  }

  async function responderPreAgendamento(quer: boolean) {
    setSalvando(true);
    if (quer) {
      await supabase.from("clientes").update({ pre_agendamento_ativo: true }).eq("profile_id", clienteId);
      setAtivou(true);
    }
    setSalvando(false);
    setEtapa("concluido");
  }

  if (etapa === "dispensado") return null;

  return (
    <Card className="mt-6 border-border bg-ink-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl font-normal tracking-wide">Só mais uma coisa (opcional)</CardTitle>
      </CardHeader>
      <CardContent>
        {etapa === "pergunta1" && (
          <>
            <p className="text-sm text-muted-foreground">
              De quanto em quanto tempo você costuma cortar o cabelo ou fazer a barba (mais ou menos)?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OPCOES_FREQUENCIA.map((op) => (
                <button
                  key={op.dias}
                  disabled={salvando}
                  onClick={() => escolherFrequencia(op)}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:opacity-50"
                >
                  {op.label}
                </button>
              ))}
            </div>
            <button
              disabled={salvando}
              onClick={() => setEtapa("dispensado")}
              className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Não sei dizer
            </button>
          </>
        )}

        {etapa === "pergunta2" && frequenciaEscolhida && (
          <>
            <p className="text-sm text-muted-foreground">
              Quer deixar isso pré-marcado? Te aviso por WhatsApp perto da data (a cada {frequenciaEscolhida.label}).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                disabled={salvando}
                onClick={() => responderPreAgendamento(true)}
                className="rounded-lg border border-gold bg-gold-gradient px-4 py-3 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Sim, pode deixar
              </button>
              <button
                disabled={salvando}
                onClick={() => responderPreAgendamento(false)}
                className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-gold disabled:opacity-50"
              >
                Não, prefiro agendar na hora
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/80">
              Você pode ligar ou desligar isso quando quiser em Minha Conta.
            </p>
          </>
        )}

        {etapa === "concluido" && (
          <p className="text-sm text-gold">
            {ativou
              ? "Combinado! Vamos te avisar por WhatsApp perto da data — você confirma ou recusa por lá."
              : "Sem problemas! Se mudar de ideia, dá pra ligar isso quando quiser em Minha Conta."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
