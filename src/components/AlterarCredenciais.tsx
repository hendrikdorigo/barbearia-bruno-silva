"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlterarCredenciais({ emailAtual }: { emailAtual: string }) {
  const supabase = createClient();

  const [novoEmail, setNovoEmail] = useState(emailAtual);
  const [emailMsg, setEmailMsg] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvandoEmail, setSalvandoEmail] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [senhaMsg, setSenhaMsg] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  async function alterarEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);

    if (novoEmail === emailAtual) {
      setEmailMsg({ tipo: "erro", texto: "Esse já é o seu e-mail atual." });
      return;
    }

    setSalvandoEmail(true);
    const { error } = await supabase.auth.updateUser({ email: novoEmail });
    setSalvandoEmail(false);

    if (error) {
      setEmailMsg({ tipo: "erro", texto: error.message });
      return;
    }
    setEmailMsg({
      tipo: "sucesso",
      texto: "Enviamos um link de confirmação para o novo e-mail. A troca só é concluída depois que você clicar nele.",
    });
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setSenhaMsg(null);

    if (novaSenha.length < 6) {
      setSenhaMsg({ tipo: "erro", texto: "A nova senha precisa ter pelo menos 6 caracteres." });
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setSenhaMsg({ tipo: "erro", texto: "As senhas não coincidem." });
      return;
    }

    setSalvandoSenha(true);

    // Reautentica com a senha atual antes de trocar, para confirmar que é
    // realmente o dono da conta (updateUser sozinho aceitaria a troca só
    // com a sessão ativa, sem pedir a senha atual).
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: senhaAtual,
      });
      if (signInError) {
        setSalvandoSenha(false);
        setSenhaMsg({ tipo: "erro", texto: "Senha atual incorreta." });
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvandoSenha(false);

    if (error) {
      setSenhaMsg({ tipo: "erro", texto: error.message });
      return;
    }
    setSenhaMsg({ tipo: "sucesso", texto: "Senha alterada com sucesso." });
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card className="border-border bg-ink-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl font-normal tracking-wide">E-mail</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={alterarEmail}>
            <FieldGroup>
              <Field data-invalid={emailMsg?.tipo === "erro"}>
                <FieldLabel htmlFor="novo-email">Novo e-mail</FieldLabel>
                <Input
                  id="novo-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={novoEmail}
                  aria-invalid={emailMsg?.tipo === "erro"}
                  onChange={(e) => setNovoEmail(e.target.value)}
                />
                {emailMsg?.tipo === "erro" && <FieldError>{emailMsg.texto}</FieldError>}
                {emailMsg?.tipo === "sucesso" && (
                  <FieldDescription className="text-success">{emailMsg.texto}</FieldDescription>
                )}
              </Field>
              <Button type="submit" disabled={salvandoEmail} variant="outline" className="w-full">
                {salvandoEmail ? "Salvando..." : "Alterar e-mail"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-ink-soft">
        <CardHeader>
          <CardTitle className="font-display text-xl font-normal tracking-wide">Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={alterarSenha}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="senha-atual">Senha atual</FieldLabel>
                <Input
                  id="senha-atual"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nova-senha">Nova senha</FieldLabel>
                <Input
                  id="nova-senha"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </Field>
              <Field data-invalid={confirmarNovaSenha.length > 0 && confirmarNovaSenha !== novaSenha}>
                <FieldLabel htmlFor="confirmar-nova-senha">Confirmar nova senha</FieldLabel>
                <Input
                  id="confirmar-nova-senha"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmarNovaSenha}
                  aria-invalid={confirmarNovaSenha.length > 0 && confirmarNovaSenha !== novaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                />
                {senhaMsg?.tipo === "erro" && <FieldError>{senhaMsg.texto}</FieldError>}
                {senhaMsg?.tipo === "sucesso" && (
                  <FieldDescription className="text-success">{senhaMsg.texto}</FieldDescription>
                )}
              </Field>
              <Button type="submit" disabled={salvandoSenha} variant="outline" className="w-full">
                {salvandoSenha ? "Salvando..." : "Alterar senha"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
