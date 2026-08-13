"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
      <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
        <div className="flex flex-wrap gap-3">
          <select
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            className="flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          >
            <option value="todos">Todos os serviços</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          >
            <option value="desconto">Desconto</option>
            <option value="acrescimo">Acréscimo</option>
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-28 rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <select
            value={valorTipo}
            onChange={(e) => setValorTipo(e.target.value as any)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          >
            <option value="percentual">% (percentual)</option>
            <option value="fixo">R$ (fixo)</option>
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setAplicacao("periodo")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              aplicacao === "periodo"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-ink-line text-neutral-300 hover:border-gold"
            }`}
          >
            Período de datas
          </button>
          <button
            onClick={() => setAplicacao("dia_semana")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              aplicacao === "dia_semana"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-ink-line text-neutral-300 hover:border-gold"
            }`}
          >
            Todo dia da semana
          </button>
        </div>

        {aplicacao === "periodo" ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-neutral-100 focus:border-gold focus:outline-none"
            />
            <span className="text-neutral-500">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              placeholder="opcional"
              className="rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
        ) : (
          <select
            value={diaSemana}
            onChange={(e) => setDiaSemana(Number(e.target.value))}
            className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-4 py-2.5 text-neutral-100 focus:border-gold focus:outline-none"
          >
            {DIAS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
        )}

        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — ex: promoção de sexta, feriado..."
          className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-4 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
        />

        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

        <button
          onClick={adicionar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Adicionar regra"}
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {ajustes.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma regra de preço cadastrada.</p>
        )}
        {ajustes.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                {a.tipo === "desconto" ? "Desconto" : "Acréscimo"} de{" "}
                {a.valor_tipo === "percentual" ? `${a.valor}%` : `R$ ${Number(a.valor).toFixed(2)}`}
                {" · "}
                {servicos.find((s) => s.id === a.servico_id)?.nome ?? "Todos os serviços"}
              </p>
              <p className="text-xs text-neutral-400">
                {a.dia_semana !== null
                  ? `Toda ${DIAS[a.dia_semana]}`
                  : `${a.data_inicio ?? "?"}${a.data_fim ? ` até ${a.data_fim}` : " em diante"}`}
                {a.motivo ? ` · ${a.motivo}` : ""}
              </p>
            </div>
            <button
              onClick={() => remover(a.id)}
              className="rounded-full border border-ink-line px-3 py-1.5 text-xs font-bold uppercase text-neutral-400 hover:border-red-400 hover:text-red-400"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
