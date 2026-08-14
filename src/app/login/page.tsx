"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Image src="/logo-full.png" alt="Barbearia Bruno Silva" width={220} height={194} priority />
      </div>

      <Card className="border-border bg-ink-soft">
        <CardContent className="px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Bem-vindo de volta
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">Entrar</h1>

          <form onSubmit={entrar} className="mt-8">
            <FieldGroup>
              <Field data-invalid={!!erro}>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!erro}
                />
              </Field>
              <Field data-invalid={!!erro}>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <Input
                  id="senha"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  aria-invalid={!!erro}
                />
                <FieldError>{erro}</FieldError>
              </Field>
              <Button type="submit" disabled={loading} className="mt-1 w-full uppercase tracking-widest">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-gold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
