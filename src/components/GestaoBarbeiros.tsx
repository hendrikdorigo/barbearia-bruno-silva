"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { cn } from "@/lib/utils";

export default function GestaoBarbeiros({
  barbeiros,
  barbeirosComHistorico,
}: {
  barbeiros: any[];
  barbeirosComHistorico: string[];
}) {
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
  const [editando, setEditando] = useState<any | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const router = useRouter();
  const confirmar = useConfirmacao();
  const temHistorico = new Set(barbeirosComHistorico);

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
    toast.success("Barbeiro cadastrado.");
    router.refresh();
  }

  async function alternarAtivo(profile_id: string, ativo: boolean) {
    const resp = await fetch("/api/admin/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id, ativo: !ativo }),
    });
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}));
      toast.error(json.error ?? "Erro ao atualizar barbeiro.");
      return;
    }
    toast.success(ativo ? "Barbeiro desativado." : "Barbeiro reativado.");
    router.refresh();
  }

  async function salvarComissao(profile_id: string) {
    setSalvandoComissao(profile_id);
    const resp = await fetch("/api/admin/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id, comissao_percentual: comissoes[profile_id] }),
    });
    setSalvandoComissao(null);
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}));
      toast.error(json.error ?? "Erro ao salvar comissão.");
      return;
    }
    router.refresh();
  }

  async function excluir(b: any) {
    const ok = await confirmar({
      titulo: `Excluir ${b.profiles?.nome}?`,
      descricao: "Isso apaga o cadastro do barbeiro por completo. Essa ação não pode ser desfeita.",
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindo(b.profile_id);
    const resp = await fetch("/api/admin/barbeiros", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: b.profile_id }),
    });
    setExcluindo(null);
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      toast.error(json.error ?? "Erro ao excluir barbeiro.");
      return;
    }
    toast.success("Barbeiro excluído.");
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
              <button
                onClick={() => setEditando(b)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
              >
                <PencilIcon data-icon="inline-start" />
                Editar
              </button>
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
              {!b.is_dono && (
                <span title={temHistorico.has(b.profile_id) ? "Já tem agendamentos no histórico — use \"Desativar\"." : undefined}>
                  <button
                    onClick={() => excluir(b)}
                    disabled={temHistorico.has(b.profile_id) || excluindo === b.profile_id}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                    )}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Excluir
                  </button>
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {editando && (
        <EditarBarbeiroDialog
          barbeiro={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditarBarbeiroDialog({
  barbeiro,
  onClose,
  onSalvo,
}: {
  barbeiro: any;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState(barbeiro.profiles?.nome ?? "");
  const [telefone, setTelefone] = useState(barbeiro.profiles?.telefone ?? "");
  const [bio, setBio] = useState(barbeiro.bio ?? "");
  const [especialidades, setEspecialidades] = useState(
    ((barbeiro.especialidades ?? []) as string[]).join(", ")
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!nome.trim()) {
      setErro("Nome não pode ficar em branco.");
      return;
    }
    setSalvando(true);
    setErro(null);
    const resp = await fetch("/api/admin/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: barbeiro.profile_id,
        nome,
        telefone: telefone || null,
        bio: bio || null,
        especialidades: especialidades
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setSalvando(false);
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      setErro(json.error ?? "Erro ao salvar.");
      return;
    }
    toast.success("Barbeiro atualizado.");
    onSalvo();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {barbeiro.profiles?.nome}</DialogTitle>
          <DialogDescription>Atualize os dados de cadastro do barbeiro.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <Textarea
            placeholder="Bio (aparece na página pública)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
          <Input
            placeholder="Especialidades, separadas por vírgula"
            value={especialidades}
            onChange={(e) => setEspecialidades(e.target.value)}
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
