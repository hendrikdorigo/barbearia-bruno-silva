"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Config = {
  id: string;
  meta_atendimentos: number;
  premio_descricao: string;
  ativo: boolean;
};

export default function FidelidadeEditor({
  barbeiroId,
  configsIniciais,
}: {
  barbeiroId: string;
  configsIniciais: Config[];
}) {
  const [configs, setConfigs] = useState<Config[]>(configsIniciais);
  const [meta, setMeta] = useState("10");
  const [premio, setPremio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    setErro(null);
    if (!premio || Number(meta) <= 0) {
      setErro("Preencha a meta e o prêmio.");
      return;
    }
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("fidelidade_config")
      .insert({ barbeiro_id: barbeiroId, meta_atendimentos: Number(meta), premio_descricao: premio })
      .select()
      .single();
    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setConfigs((prev) => [...prev, salvo as Config].sort((a, b) => a.meta_atendimentos - b.meta_atendimentos));
    setPremio("");
    router.refresh();
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("fidelidade_config").update({ ativo: !ativo }).eq("id", id);
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !ativo } : c)));
    router.refresh();
  }

  async function remover(id: string) {
    await supabase.from("fidelidade_config").delete().eq("id", id);
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-400">A cada</span>
          <input
            type="number"
            min="1"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            className="w-20 rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <span className="text-sm text-neutral-400">atendimentos, o cliente ganha:</span>
        </div>
        <input
          value={premio}
          onChange={(e) => setPremio(e.target.value)}
          placeholder="Ex: pomada de cabelo grátis"
          className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
        />
        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
        <button
          onClick={adicionar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Adicionar conquista"}
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {configs.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma conquista cadastrada ainda.</p>
        )}
        {configs.map((c) => (
          <div
            key={c.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
              c.ativo ? "border-ink-line bg-ink-soft" : "border-ink-line/40 bg-ink-soft/40"
            }`}
          >
            <p className="text-sm font-semibold text-neutral-100">
              {c.meta_atendimentos} atendimentos → {c.premio_descricao}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => alternarAtivo(c.id, c.ativo)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${
                  c.ativo
                    ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                    : "border-green-500/40 text-green-400 hover:bg-green-500/10"
                }`}
              >
                {c.ativo ? "Desativar" : "Ativar"}
              </button>
              <button
                onClick={() => remover(c.id)}
                className="rounded-full border border-ink-line px-3 py-1.5 text-xs font-bold uppercase text-neutral-400 hover:border-red-400 hover:text-red-400"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
