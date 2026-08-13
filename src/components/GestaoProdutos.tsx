"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  estoque: number | null;
  ativo: boolean;
};

export default function GestaoProdutos({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("bebidas");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    setErro(null);
    if (!nome || !preco) {
      setErro("Preencha nome e preço.");
      return;
    }
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("produtos")
      .insert({ nome, descricao: descricao || null, preco: Number(preco), categoria })
      .select()
      .single();
    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setProdutos((prev) => [...prev, salvo as Produto]);
    setNome("");
    setDescricao("");
    setPreco("");
    router.refresh();
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("produtos").update({ ativo: !ativo }).eq("id", id);
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !ativo } : p)));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do produto"
            className="rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria (ex: bebidas)"
            className="rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Preço"
            className="rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
        </div>
        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
        <button
          onClick={adicionar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Adicionar produto"}
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {produtos.map((p) => (
          <div
            key={p.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
              p.ativo ? "border-ink-line bg-ink-soft" : "border-ink-line/40 bg-ink-soft/40"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                {p.nome} · R$ {Number(p.preco).toFixed(2).replace(".", ",")}
              </p>
              <p className="text-xs text-neutral-500">{p.categoria}</p>
            </div>
            <button
              onClick={() => alternarAtivo(p.id, p.ativo)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${
                p.ativo
                  ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                  : "border-green-500/40 text-green-400 hover:bg-green-500/10"
              }`}
            >
              {p.ativo ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
