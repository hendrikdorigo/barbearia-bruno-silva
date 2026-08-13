"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };
type BarbeiroServico = {
  servico_id: string;
  ativo: boolean;
  preco_personalizado: number | null;
};

export default function ServicosEditor({
  barbeiroId,
  servicos,
  barbeiroServicosIniciais,
}: {
  barbeiroId: string;
  servicos: Servico[];
  barbeiroServicosIniciais: BarbeiroServico[];
}) {
  const [linhas, setLinhas] = useState<BarbeiroServico[]>(
    servicos.map((s) => {
      const existente = barbeiroServicosIniciais.find((bs) => bs.servico_id === s.id);
      return (
        existente ?? { servico_id: s.id, ativo: false, preco_personalizado: null }
      );
    })
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function atualizar(servicoId: string, campo: keyof BarbeiroServico, valor: any) {
    setLinhas((prev) =>
      prev.map((l) => (l.servico_id === servicoId ? { ...l, [campo]: valor } : l))
    );
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    const payload = linhas.map((l) => ({
      barbeiro_id: barbeiroId,
      servico_id: l.servico_id,
      ativo: l.ativo,
      preco_personalizado: l.preco_personalizado,
    }));
    const { error } = await supabase
      .from("barbeiro_servicos")
      .upsert(payload, { onConflict: "barbeiro_id,servico_id" });
    setSalvando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setMensagem("Serviços atualizados!");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {servicos.map((s) => {
        const l = linhas.find((x) => x.servico_id === s.id)!;
        return (
          <div
            key={s.id}
            className={`flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3 ${
              l.ativo ? "border-ink-line bg-ink-soft" : "border-ink-line/50 bg-ink-soft/40"
            }`}
          >
            <label className="flex w-44 items-center gap-2 text-sm font-semibold text-neutral-200">
              <input
                type="checkbox"
                checked={l.ativo}
                onChange={(e) => atualizar(s.id, "ativo", e.target.checked)}
                className="h-4 w-4 accent-[#C9A227]"
              />
              {s.nome}
            </label>

            {l.ativo ? (
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <span className="text-neutral-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={String(s.preco)}
                  value={l.preco_personalizado ?? ""}
                  onChange={(e) =>
                    atualizar(
                      s.id,
                      "preco_personalizado",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-28 rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-neutral-100 focus:border-gold focus:outline-none"
                />
                <span className="text-xs text-neutral-500">
                  (padrão R$ {Number(s.preco).toFixed(2).replace(".", ",")})
                </span>
              </div>
            ) : (
              <span className="text-sm text-neutral-500">Não oferece este serviço</span>
            )}
          </div>
        );
      })}

      {mensagem && <p className="text-sm text-gold">{mensagem}</p>}

      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-2 self-start rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar serviços"}
      </button>
    </div>
  );
}
