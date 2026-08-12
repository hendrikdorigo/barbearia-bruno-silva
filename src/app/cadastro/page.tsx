"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (signUpError || !signUpData.user) {
      setErro(signUpError?.message ?? "Não foi possível criar sua conta.");
      setLoading(false);
      return;
    }

    const userId = signUpData.user.id;
    let fotoUrl: string | null = null;

    if (foto) {
      const path = `${userId}/${Date.now()}-${foto.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, foto, { upsert: true });
      if (!uploadError) {
        fotoUrl = supabase.storage.from("avatars").getPublicUrl(path).data
          .publicUrl;
      }
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      nome,
      role: "cliente",
      telefone,
      avatar_url: fotoUrl,
    });

    if (profileError) {
      setErro(profileError.message);
      setLoading(false);
      return;
    }

    const { error: clienteError } = await supabase.from("clientes").insert({
      profile_id: userId,
      cpf,
      data_nascimento: dataNascimento,
      foto_url: fotoUrl,
    });

    setLoading(false);

    if (clienteError) {
      setErro(clienteError.message);
      return;
    }

    if (signUpData.session) {
      router.push("/");
      router.refresh();
    } else {
      router.push(
        "/login?mensagem=Verifique seu e-mail para confirmar o cadastro."
      );
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Junte-se a nós
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-neutral-50">
        Criar conta
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Cadastro necessário apenas para agendar horários.
      </p>
      <form onSubmit={cadastrar} className="mt-8 flex flex-col gap-4">
        <input
          required
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
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
          minLength={6}
          placeholder="Senha (mínimo 6 caracteres)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        <input
          required
          placeholder="CPF"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        <label className="text-xs text-neutral-500">Data de nascimento</label>
        <input
          type="date"
          required
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 focus:border-gold focus:outline-none"
        />
        <input
          placeholder="Telefone (WhatsApp)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        <label className="text-xs text-neutral-500">Foto (opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          className="text-sm text-neutral-400"
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          disabled={loading}
          className="mt-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <p className="mt-6 text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
