"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { nomeClienteAgendamento } from "@/lib/cliente-agendamento";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
};

export default function RepassesPainel({ agendamentos }: { agendamentos: any[] }) {
  const [barbeiroAbertoId, setBarbeiroAbertoId] = useState<string | null>(null);

  // Como o pagamento cai sempre na conta do Bruno, o que importa aqui é o
  // complemento de valor_repasse_bruno: quanto o Bruno precisa repassar
  // (pagar) para cada barbeiro parceiro pelos atendimentos que ele fez.
  const porBarbeiro = useMemo(() => {
    type Linha = { nome: string; percentual: number; total: number; itens: any[] };
    const mapa = new Map<string, Linha>();
    for (const a of agendamentos) {
      const barbeiro = a.barbeiros;
      if (!barbeiro || barbeiro.is_dono) continue;
      const comissao = Number(a.valor_servico) - Number(a.valor_repasse_bruno);
      const atual: Linha = mapa.get(a.barbeiro_id) ?? {
        nome: barbeiro.profiles?.nome ?? "—",
        percentual: barbeiro.comissao_percentual,
        total: 0,
        itens: [],
      };
      atual.total += comissao;
      atual.itens.push({ ...a, comissao });
      mapa.set(a.barbeiro_id, atual);
    }
    return mapa;
  }, [agendamentos]);

  const totalGeral = [...porBarbeiro.values()].reduce((acc, v) => acc + v.total, 0);
  const barbeiroAberto = barbeiroAbertoId ? porBarbeiro.get(barbeiroAbertoId) : null;

  return (
    <>
      <Card className="mt-8 gap-1 border-gold/40 bg-gold/10 p-5">
        <p className="text-xs uppercase tracking-widest text-gold">Total a repassar</p>
        <p className="font-mono text-4xl font-medium text-foreground">
          R$ {totalGeral.toFixed(2).replace(".", ",")}
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        {[...porBarbeiro.entries()].map(([id, v]) => (
          <button
            key={id}
            onClick={() => setBarbeiroAbertoId(id)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-ink-soft p-4 text-left transition-colors hover:border-gold"
          >
            <div>
              <p className="font-semibold text-foreground">{v.nome}</p>
              <p className="text-xs text-muted-foreground">
                {v.itens.length} atendimento(s) · {v.percentual}% de comissão
              </p>
            </div>
            <p className="font-mono text-2xl font-medium text-gold-gradient">
              R$ {v.total.toFixed(2).replace(".", ",")}
            </p>
          </button>
        ))}
        {porBarbeiro.size === 0 && (
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
              {barbeiroAberto?.itens.length} atendimento(s) · total a repassar{" "}
              <span className="font-mono text-gold">
                R$ {barbeiroAberto?.total.toFixed(2).replace(".", ",")}
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
