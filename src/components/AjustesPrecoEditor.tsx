"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-gold focus:outline-none";

type Servico = { id: string; nome: string };
type Ajuste = {
  id: string;
  servico_id: string | null;
  tipo: "desconto" | "acrescimo";
  valor_tipo: "percentual" | "fixo";
  valor: number;
  data_inicio: string | null;
  data_fim: string | null;
  dia_semana: number | null;
  motivo: string | null;
  ativo: boolean;
};

export default function AjustesPrecoEditor({
  barbeiroId,
  servicos,
  ajustesIniciais,
}: {
  barbeiroId: string;
  servicos: Servico[];
  ajustesIniciais: Ajuste[];
}) {
  const [ajustes, setAjustes] = useState<Ajuste[]>(ajustesIniciais);
  const [servicoId, setServicoId] = useState<string>("todos");
  const [tipo, setTipo] = useState<"desconto" | "acrescimo">("desconto");
  const [valorTipo, setValorTipo] = useState<"percentual" | "fixo">("percentual");
  const [valor, setValor] = useState("10");
  const [aplicacao, setAplicacao] = useState<"periodo" | "dia_semana">("periodo");
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState("");
  const [diaSemana, setDiaSemana] = useState(5);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    setErro(null);
    if (!valor || Number(valor) <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    setSalvando(true);

    const payload = {
      barbeiro_id: barbeiroId,
      servico_id: servicoId === "todos" ? null : servicoId,
      tipo,
      valor_tipo: valorTipo,
      valor: Number(valor),
      data_inicio: aplicacao === "periodo" ? dataInicio : null,
      data_fim: aplicacao === "periodo" && dataFim ? dataFim : null,
      dia_semana: aplicacao === "dia_semana" ? diaSemana : null,
      motivo: motivo || null,
      ativo: true,
    };

    const { data: salvo, error } = await supabase
      .from("servico_ajustes")
      .insert(payload)
      .select()
      .single();

    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setAjustes((prev) => [salvo as Ajuste, ...prev]);
    setMotivo("");
    router.refresh();
  }

  async function remover(id: string) {
    await supabase.from("servico_ajustes").delete().eq("id", id);
    setAjustes((prev) => prev.filter((a) => a.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <Card className="border-border bg-ink-soft p-5">
        <div className="flex flex-wrap gap-3">
          <select
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            className={cn(selectClass, "flex-1")}
          >
            <option value="todos">Todos os serviços</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className={selectClass}>
            <option value="desconto">Desconto</option>
            <option value="acrescimo">Acréscimo</option>
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28 bg-background"
          />
          <select
            value={valorTipo}
            onChange={(e) => setValorTipo(e.target.value as any)}
            className={selectClass}
          >
            <option value="percentual">% (percentual)</option>
            <option value="fixo">R$ (fixo)</option>
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setAplicacao("periodo")}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              aplicacao === "periodo"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            Período de datas
          </button>
          <button
            onClick={() => setAplicacao("dia_semana")}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              aplicacao === "dia_semana"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            Todo dia da semana
          </button>
        </div>

        {aplicacao === "periodo" ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-auto bg-background"
            />
            <span>até</span>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              placeholder="opcional"
              className="w-auto bg-background"
            />
          </div>
        ) : (
          <select
            value={diaSemana}
            onChange={(e) => setDiaSemana(Number(e.target.value))}
            className={cn(selectClass, "mt-3 w-full")}
          >
            {DIAS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
        )}

        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — ex: promoção de sexta, feriado..."
          className="mt-3 bg-background"
        />

        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

        <Button onClick={adicionar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Salvando..." : "Adicionar regra"}
        </Button>
      </Card>

      <div className="mt-5 space-y-2">
        {ajustes.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma regra de preço cadastrada.</p>
        )}
        {ajustes.map((a) => (
          <Card
            key={a.id}
            className="flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {a.tipo === "desconto" ? "Desconto" : "Acréscimo"} de{" "}
                {a.valor_tipo === "percentual" ? `${a.valor}%` : `R$ ${Number(a.valor).toFixed(2)}`}
                {" · "}
                {servicos.find((s) => s.id === a.servico_id)?.nome ?? "Todos os serviços"}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.dia_semana !== null
                  ? `Toda ${DIAS[a.dia_semana]}`
                  : `${a.data_inicio ?? "?"}${a.data_fim ? ` até ${a.data_fim}` : " em diante"}`}
                {a.motivo ? ` · ${a.motivo}` : ""}
              </p>
            </div>
            <button
              onClick={() => remover(a.id)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full hover:border-destructive/50 hover:text-destructive"
              )}
            >
              Remover
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
