"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GestaoBarbeiros({ barbeiros }: { barbeiros: any[] }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  async function cadastrar() {
    setSalvando(true);
    setErro(null);
    const resp = await fetch("/api/admin/barbeiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, telefone }),
    });
    const json = await resp.json();
    setSalvando(false);
    if (!resp.ok) {
      setErro(json.error);
      return;
    }
    setNome("");
    setEmail("");
    setSenha("");
    setTelefone("");
    router.refresh();
  }

  async function alternarAtivo(profile_id: string, ativo: boolean) {
    await fetch("/api/admin/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id, ativo: !ativo }),
    });
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
        <p className="text-sm font-semibold text-neutral-100">Novo barbeiro parceiro</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <input
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <input
            placeholder="Senha provisória"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
          />
        </div>
        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
        <button
          onClick={cadastrar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Cadastrando..." : "Cadastrar barbeiro"}
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {barbeiros.map((b) => (
          <div
            key={b.profile_id}
            className="flex items-center justify-between rounded-xl border border-ink-line bg-ink-soft p-4"
          >
            <div>
              <p className="font-semibold text-neutral-100">
                {b.profiles?.nome} {b.is_dono && <span className="text-xs text-gold">(dono)</span>}
              </p>
              <p className="text-xs text-neutral-500">{b.profiles?.telefone}</p>
            </div>
            {!b.is_dono && (
              <button
                onClick={() => alternarAtivo(b.profile_id, b.ativo)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${
                  b.ativo
                    ? "border border-red-500/40 text-red-400"
                    : "border border-green-500/40 text-green-400"
                }`}
              >
                {b.ativo ? "Desativar" : "Reativar"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
