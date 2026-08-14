"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="mb-8 flex justify-center">
        <Image src="/logo-full.png" alt="Barbearia Bruno Silva" width={200} height={176} priority />
      </div>

      <Card className="border-border bg-ink-soft">
        <CardContent className="px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Junte-se a nós
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastro necessário apenas para agendar horários.
          </p>

          <form onSubmit={cadastrar} className="mt-8">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nome">Nome completo</FieldLabel>
                <Input
                  id="nome"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <Input
                  id="senha"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                <Input
                  id="cpf"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nascimento">Data de nascimento</FieldLabel>
                <Input
                  id="nascimento"
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="telefone">Telefone (WhatsApp)</FieldLabel>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="foto">Foto</FieldLabel>
                <Input
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                />
                <FieldDescription>Opcional — usada no seu perfil.</FieldDescription>
              </Field>

              {erro && (
                <Field data-invalid>
                  <FieldError>{erro}</FieldError>
                </Field>
              )}

              <Button type="submit" disabled={loading} className="mt-1 w-full uppercase tracking-widest">
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-gold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
