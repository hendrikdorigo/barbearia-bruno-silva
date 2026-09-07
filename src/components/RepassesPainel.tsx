"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WalletIcon, ImageIcon, XIcon, Trash2Icon, CheckCircle2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { nomeClienteAgendamento } from "@/lib/cliente-agendamento";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
};

type Pagamento = {
  id: string;
  barbeiro_id: string;
  valor: number;
  observacao: string | null;
  imagem_url: string | null;
  created_at: string;
  profiles: { nome: string } | null;
};

export default function RepassesPainel({
  agendamentos,
  pagamentosIniciais,
}: {
  agendamentos: any[];
  pagamentosIniciais: Pagamento[];
}) {
  const [barbeiroAbertoId, setBarbeiroAbertoId] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(pagamentosIniciais);
  const [dialogAberto, setDialogAberto] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  // Como o pagamento cai sempre na conta do Bruno, o que importa aqui é o
  // complemento de valor_repasse_bruno: quanto o Bruno precisa repassar
  // (pagar) para cada barbeiro parceiro pelos atendimentos que ele fez.
  const porBarbeiro = useMemo(() => {
    type Linha = { nome: string; percentual: number; totalComissao: number; itens: any[] };
    const mapa = new Map<string, Linha>();
    for (const a of agendamentos) {
      const barbeiro = a.barbeiros;
      if (!barbeiro || barbeiro.is_dono) continue;
      const comissao = Number(a.valor_servico) - Number(a.valor_repasse_bruno);
      const atual: Linha = mapa.get(a.barbeiro_id) ?? {
        nome: barbeiro.profiles?.nome ?? "—",
        percentual: barbeiro.comissao_percentual,
        totalComissao: 0,
        itens: [],
      };
      atual.totalComissao += comissao;
      atual.itens.push({ ...a, comissao });
      mapa.set(a.barbeiro_id, atual);
    }
    return mapa;
  }, [agendamentos]);

  const pagoPorBarbeiro = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of pagamentos) {
      mapa.set(p.barbeiro_id, (mapa.get(p.barbeiro_id) ?? 0) + Number(p.valor));
    }
    return mapa;
  }, [pagamentos]);

  const linhas = useMemo(
    () =>
      [...porBarbeiro.entries()].map(([id, v]) => {
        const pago = pagoPorBarbeiro.get(id) ?? 0;
        return { id, ...v, pago, saldo: v.totalComissao - pago };
      }),
    [porBarbeiro, pagoPorBarbeiro]
  );

  const totalGeral = linhas.reduce((acc, v) => acc + v.saldo, 0);
  const barbeiroAberto = barbeiroAbertoId ? linhas.find((l) => l.id === barbeiroAbertoId) : null;
  const pagamentosDoBarbeiro = pagamentos
    .filter((p) => p.barbeiro_id === barbeiroAbertoId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  async function excluirPagamento(p: Pagamento) {
    const ok = await confirmar({
      titulo: "Excluir este pagamento?",
      descricao: "O valor volta a contar como pendente pra esse barbeiro.",
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("repasses_pagamentos").delete().eq("id", p.id);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    setPagamentos((prev) => prev.filter((x) => x.id !== p.id));
    toast.success("Pagamento excluído.");
    router.refresh();
  }

  return (
    <>
      <Card className="mt-8 gap-1 border-gold/40 bg-gold/10 p-5">
        <p className="text-xs uppercase tracking-widest text-gold">Total a repassar</p>
        <p className="font-mono text-4xl font-medium text-foreground">
          R$ {totalGeral.toFixed(2).replace(".", ",")}
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        {linhas.map((v) => (
          <button
            key={v.id}
            onClick={() => setBarbeiroAbertoId(v.id)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-ink-soft p-4 text-left transition-colors hover:border-gold"
          >
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                {v.nome}
                {v.saldo <= 0 && <CheckCircle2Icon className="size-4 text-success" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {v.itens.length} atendimento(s) · {v.percentual}% de comissão
                {v.pago > 0 && ` · já pago R$ ${v.pago.toFixed(2).replace(".", ",")}`}
              </p>
            </div>
            <p
              className={cn(
                "font-mono text-2xl font-medium",
                v.saldo <= 0 ? "text-success" : "text-gold-gradient"
              )}
            >
              R$ {v.saldo.toFixed(2).replace(".", ",")}
            </p>
          </button>
        ))}
        {linhas.length === 0 && (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WalletIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhum repasse registrado ainda</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <Sheet open={!!barbeiroAbertoId} onOpenChange={(open) => !open && setBarbeiroAbertoId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Histórico de {barbeiroAberto?.nome}</SheetTitle>
            <SheetDescription>
              {barbeiroAberto?.itens.length} atendimento(s) · comissão total{" "}
              <span className="font-mono">
                R$ {barbeiroAberto?.totalComissao.toFixed(2).replace(".", ",")}
              </span>{" "}
              · saldo a pagar{" "}
              <span className={cn("font-mono", (barbeiroAberto?.saldo ?? 0) <= 0 ? "text-success" : "text-gold")}>
                R$ {barbeiroAberto?.saldo.toFixed(2).replace(".", ",")}
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <Button
              size="sm"
              onClick={() => setDialogAberto(true)}
              className="w-fit uppercase tracking-widest"
            >
              Registrar pagamento
            </Button>

            <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">Atendimentos</p>
            <div className="scrollbar-thin mt-2 overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-ink-soft hover:bg-ink-soft">
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Serviço (R$)</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barbeiroAberto?.itens.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(a.data_hora).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{nomeClienteAgendamento(a)}</TableCell>
                      <TableCell className="text-muted-foreground">{a.servicos?.nome}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            a.status === "concluido"
                              ? "border-transparent bg-gold/15 uppercase text-gold"
                              : "border-transparent bg-success/15 uppercase text-success"
                          }
                        >
                          {STATUS_LABEL[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-gold-gradient">
                        R$ {a.comissao.toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/painel/barbeiro/comanda/${a.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" }) + " rounded-full"}
                        >
                          Ver comanda
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!barbeiroAberto || barbeiroAberto.itens.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                        Nenhum atendimento encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
              Pagamentos registrados
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {pagamentosDoBarbeiro.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
              )}
              {pagamentosDoBarbeiro.map((p) => (
                <Card key={p.id} className="flex-row items-start justify-between gap-3 border-border bg-ink-soft p-3">
                  <div className="flex items-start gap-3">
                    {p.imagem_url && (
                      <a href={p.imagem_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={p.imagem_url}
                          alt="Comprovante"
                          className="size-14 shrink-0 rounded-lg border border-border object-cover"
                        />
                      </a>
                    )}
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                      </p>
                      {p.observacao && <p className="mt-0.5 text-sm text-muted-foreground">{p.observacao}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("pt-BR")} · {p.profiles?.nome ?? "Equipe"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => excluirPagamento(p)}
                    aria-label="Excluir pagamento"
                    className="shrink-0 text-muted-foreground/70 hover:text-destructive"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {barbeiroAbertoId && (
        <RegistrarPagamentoDialog
          open={dialogAberto}
          onClose={() => setDialogAberto(false)}
          barbeiroId={barbeiroAbertoId}
          saldoPendente={barbeiroAberto?.saldo ?? 0}
          onRegistrado={(novo) => {
            setPagamentos((prev) => [novo, ...prev]);
            setDialogAberto(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function RegistrarPagamentoDialog({
  open,
  onClose,
  barbeiroId,
  saldoPendente,
  onRegistrado,
}: {
  open: boolean;
  onClose: () => void;
  barbeiroId: string;
  saldoPendente: number;
  onRegistrado: (pagamento: Pagamento) => void;
}) {
  const [valor, setValor] = useState(() => Math.max(saldoPendente, 0).toFixed(2));
  const [observacao, setObservacao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputImagem = useRef<HTMLInputElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    setValor(Math.max(saldoPendente, 0).toFixed(2));
    setObservacao("");
    setErro(null);
    escolherImagem(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function escolherImagem(arquivo: File | null) {
    setImagem(arquivo);
    setPreview((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return arquivo ? URL.createObjectURL(arquivo) : null;
    });
  }

  async function salvar() {
    const numero = Number(valor);
    if (!numero || numero <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    setSalvando(true);
    setErro(null);

    let imagemUrl: string | null = null;
    if (imagem) {
      const path = `${barbeiroId}/${Date.now()}-${imagem.name}`;
      const { error: erroUpload } = await supabase.storage.from("repasses").upload(path, imagem);
      if (erroUpload) {
        setSalvando(false);
        setErro(erroUpload.message);
        return;
      }
      imagemUrl = supabase.storage.from("repasses").getPublicUrl(path).data.publicUrl;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: salvo, error } = await supabase
      .from("repasses_pagamentos")
      .insert({
        barbeiro_id: barbeiroId,
        valor: numero,
        observacao: observacao.trim() || null,
        imagem_url: imagemUrl,
        criado_por: userData.user!.id,
      })
      .select("*, profiles!repasses_pagamentos_criado_por_fkey(nome)")
      .single();

    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    toast.success("Pagamento registrado.");
    onRegistrado(salvo as any);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Saldo pendente: R$ {saldoPendente.toFixed(2).replace(".", ",")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor pago"
          />
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (opcional): Pix, dinheiro, referente a que período..."
            rows={2}
          />
          {preview ? (
            <div className="relative w-fit">
              <img src={preview} alt="" className="h-28 w-28 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => escolherImagem(null)}
                aria-label="Remover imagem"
                className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputImagem.current?.click()}
              className="w-fit uppercase tracking-widest"
            >
              <ImageIcon className="size-3.5" data-icon="inline-start" />
              Anexar comprovante
            </Button>
          )}
          <input
            ref={inputImagem}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => escolherImagem(e.target.files?.[0] ?? null)}
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
