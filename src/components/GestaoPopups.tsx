"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Popup = {
  id: string;
  titulo: string;
  tipo: "video" | "imagem" | "texto";
  conteudo_url: string | null;
  mensagem: string | null;
  publico: "todos" | "clientes" | "barbeiros";
  ativo: boolean;
  is_boas_vindas: boolean;
};

export default function GestaoPopups({ popupsIniciais, userId }: { popupsIniciais: Popup[]; userId: string }) {
  const [popups, setPopups] = useState<Popup[]>(popupsIniciais);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"video" | "imagem" | "texto">("texto");
  const [mensagem, setMensagem] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [publico, setPublico] = useState<"todos" | "clientes" | "barbeiros">("todos");
  const [isBoasVindas, setIsBoasVindas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function criar() {
    setErro(null);
    if (!titulo) {
      setErro("Dê um título ao pop-up.");
      return;
    }
    setSalvando(true);

    let conteudoUrl: string | null = null;
    if (tipo !== "texto" && arquivo) {
      const path = `popups/${Date.now()}-${arquivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("comunidade")
        .upload(path, arquivo, { upsert: true });
      if (uploadError) {
        setErro(uploadError.message);
        setSalvando(false);
        return;
      }
      conteudoUrl = supabase.storage.from("comunidade").getPublicUrl(path).data.publicUrl;
    }

    const { data: salvo, error } = await supabase
      .from("app_popups")
      .insert({
        titulo,
        tipo,
        conteudo_url: conteudoUrl,
        mensagem: mensagem || null,
        publico,
        is_boas_vindas: isBoasVindas,
        criado_por: userId,
      })
      .select()
      .single();

    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setPopups((prev) => [salvo as Popup, ...prev]);
    setTitulo("");
    setMensagem("");
    setArquivo(null);
    router.refresh();
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("app_popups").update({ ativo: !ativo }).eq("id", id);
    setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !ativo } : p)));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do pop-up"
          className="w-full rounded-lg border border-ink-line bg-ink px-3 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
        />

        <div className="mt-3 flex gap-2">
          {(["texto", "imagem", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${
                tipo === t ? "bg-gold-gradient text-ink" : "border border-ink-line text-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Mensagem"
          rows={3}
          className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
        />

        {tipo !== "texto" && (
          <input
            type="file"
            accept={tipo === "imagem" ? "image/*" : "video/*"}
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="mt-3 text-sm text-neutral-400"
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={publico}
            onChange={(e) => setPublico(e.target.value as any)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          >
            <option value="todos">Todos</option>
            <option value="clientes">Só clientes</option>
            <option value="barbeiros">Só barbeiros</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={isBoasVindas}
              onChange={(e) => setIsBoasVindas(e.target.checked)}
              className="h-4 w-4 accent-[#C9A227]"
            />
            Vídeo/mensagem de boas-vindas (1º acesso)
          </label>
        </div>

        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

        <button
          onClick={criar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Criar pop-up"}
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {popups.map((p) => (
          <div
            key={p.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
              p.ativo ? "border-ink-line bg-ink-soft" : "border-ink-line/40 bg-ink-soft/40"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                {p.titulo} {p.is_boas_vindas && "· boas-vindas"}
              </p>
              <p className="text-xs text-neutral-500">
                {p.tipo} · {p.publico}
              </p>
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
