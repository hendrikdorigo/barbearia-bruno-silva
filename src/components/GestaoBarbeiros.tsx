"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function GestaoBarbeiros({ barbeiros }: { barbeiros: any[] }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [comissoes, setComissoes] = useState<Record<string, number>>(
    Object.fromEntries(barbeiros.map((b) => [b.profile_id, b.comissao_percentual]))
  );
  const [salvandoComissao, setSalvandoComissao] = useState<string | null>(null);
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

  async function salvarComissao(profile_id: string) {
    setSalvandoComissao(profile_id);
    await fetch("/api/admin/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id, comissao_percentual: comissoes[profile_id] }),
    });
    setSalvandoComissao(null);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <Card className="border-border bg-ink-soft p-5">
        <p className="text-sm font-semibold text-foreground">Novo barbeiro parceiro</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background" />
          <Input
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background"
          />
          <Input
            placeholder="Senha provisória"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="bg-background"
          />
          <Input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="bg-background"
          />
        </div>
        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
        <Button onClick={cadastrar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Cadastrando..." : "Cadastrar barbeiro"}
        </Button>
      </Card>

      <div className="mt-8 space-y-3">
        {barbeiros.map((b) => (
          <Card
            key={b.profile_id}
            className="flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft p-4"
          >
            <div>
              <p className="flex items-center gap-2 font-semibold text-foreground">
                {b.profiles?.nome}
                {b.is_dono && (
                  <Badge variant="outline" className="text-gold">
                    dono
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{b.profiles?.telefone}</p>
            </div>
            <div className="flex items-center gap-3">
              {!b.is_dono && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={comissoes[b.profile_id] ?? 50}
                    onChange={(e) =>
                      setComissoes((prev) => ({ ...prev, [b.profile_id]: Number(e.target.value) }))
                    }
                    onBlur={() => salvarComissao(b.profile_id)}
                    disabled={salvandoComissao === b.profile_id}
                    className="h-9 w-20 bg-background text-right"
                  />
                  <span className="text-xs text-muted-foreground">% comissão</span>
                </div>
              )}
              {!b.is_dono && (
                <button
                  onClick={() => alternarAtivo(b.profile_id, b.ativo)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full",
                    b.ativo
                      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                      : "border-success/40 text-success hover:bg-success/10"
                  )}
                >
                  {b.ativo ? "Desativar" : "Reativar"}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
