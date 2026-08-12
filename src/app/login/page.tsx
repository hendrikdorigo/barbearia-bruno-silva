"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setLoading(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Bem-vindo de volta
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-neutral-50">
        Entrar
      </h1>
      <form onSubmit={entrar} className="mt-8 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          disabled={loading}
          className="mt-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-sm text-neutral-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-gold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
