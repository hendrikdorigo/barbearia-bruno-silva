"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatarCPF } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Cliente entra só com CPF (sem senha) - aqui ele só vê o CPF (não editável,
 * é a credencial de login) e pode informar/trocar um e-mail de contato
 * opcional (não usado para autenticação, só para o barbeiro entrar em
 * contato se precisar).
 */
export default function AlterarContatoCliente({
  cpf,
  emailAtual,
  telefoneAtual,
}: {
  cpf: string;
  emailAtual: string | null;
  telefoneAtual: string | null;
}) {
  const supabase = createClient();
  const [email, setEmail] = useState(emailAtual ?? "");
  const [telefone, setTelefone] = useState(telefoneAtual ?? "");
  const [msg, setMsg] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSalvando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [{ error: errorCliente }, { error: errorPerfil }] = await Promise.all([
      supabase.from("clientes").update({ email: email || null }).eq("profile_id", user!.id),
      supabase.from("profiles").update({ telefone: telefone || null }).eq("id", user!.id),
    ]);

    setSalvando(false);
    const error = errorCliente ?? errorPerfil;
    if (error) {
      setMsg({ tipo: "erro", texto: error.message });
      return;
    }
    setMsg({ tipo: "sucesso", texto: "Contato atualizado." });
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card className="border-border bg-ink-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl font-normal tracking-wide">CPF</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <Input value={formatarCPF(cpf)} disabled className="bg-background" />
            <FieldDescription>
              É com esse CPF que você entra na sua conta. Fale com o barbeiro
              se precisar trocar.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card className="border-border bg-ink-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl font-normal tracking-wide">Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="telefone-contato">Telefone (WhatsApp)</FieldLabel>
                <Input
                  id="telefone-contato"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
                <FieldDescription>É pra esse número que mandamos os lembretes de horário.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="email-contato">E-mail (opcional)</FieldLabel>
                <Input
                  id="email-contato"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FieldDescription
                  className={msg?.tipo === "sucesso" ? "text-success" : msg?.tipo === "erro" ? "text-destructive" : undefined}
                >
                  {msg?.texto ?? "Não é usado para entrar - só um contato."}
                </FieldDescription>
              </Field>
              <Button type="submit" disabled={salvando} variant="outline" className="w-full">
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
