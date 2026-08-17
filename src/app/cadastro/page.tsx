"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatarCPF, normalizarCPF, validarCPF } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ANO_ATUAL = new Date().getFullYear();
const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const ANOS = Array.from({ length: 90 }, (_, i) => String(ANO_ATUAL - 14 - i));

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [diaNasc, setDiaNasc] = useState("");
  const [mesNasc, setMesNasc] = useState("");
  const [anoNasc, setAnoNasc] = useState("");
  const [telefone, setTelefone] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!diaNasc || !mesNasc || !anoNasc) {
      setErro("Selecione sua data de nascimento completa.");
      return;
    }

    const cpfDigits = normalizarCPF(cpf);
    if (!validarCPF(cpfDigits)) {
      setErro("CPF inválido. Confira os números digitados.");
      return;
    }

    setLoading(true);

    const dataNascimento = `${anoNasc}-${mesNasc}-${diaNasc.padStart(2, "0")}`;

    const resp = await fetch("/api/auth/cadastro-cliente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        cpf: cpfDigits,
        telefone,
        dataNascimento,
        emailContato: emailContato || null,
      }),
    });
    const json = await resp.json().catch(() => null);

    if (!resp.ok) {
      setErro(json?.error ?? "Não foi possível criar sua conta.");
      setLoading(false);
      return;
    }

    if (foto) {
      const path = `${json.userId}/${Date.now()}-${foto.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, foto, { upsert: true });
      if (!uploadError) {
        const fotoUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        await supabase.from("profiles").update({ avatar_url: fotoUrl }).eq("id", json.userId);
        await supabase.from("clientes").update({ foto_url: fotoUrl }).eq("profile_id", json.userId);
      }
    }

    setLoading(false);

    if (json.autoLogin) {
      router.push("/");
      router.refresh();
    } else {
      router.push("/login");
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
            Cadastro necessário apenas para agendar horários. Sem senha - você
            entra só com o CPF.
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
              <Field data-invalid={cpf.length > 0 && !validarCPF(cpf)}>
                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                <Input
                  id="cpf"
                  required
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCPF(e.target.value))}
                  maxLength={14}
                  aria-invalid={cpf.length > 0 && !validarCPF(cpf)}
                />
                <FieldDescription>É com o CPF que você entra na sua conta, sem senha.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">E-mail (opcional)</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                />
                <FieldDescription>Só um contato - não é usado para entrar.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Data de nascimento</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={diaNasc} onValueChange={setDiaNasc}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={mesNasc} onValueChange={setMesNasc}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={anoNasc} onValueChange={setAnoNasc}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANOS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
