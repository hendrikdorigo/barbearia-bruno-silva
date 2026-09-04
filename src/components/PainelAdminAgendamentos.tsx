"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { AlertTriangleIcon, Trash2Icon, ShieldOffIcon, ShieldCheckIcon, ShoppingBagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  nomeClienteAgendamento,
  qtdNoShowAgendamento,
  clienteBloqueadoAgendamento,
  ehClienteAvulso,
  criadoPeloBarbeiro,
} from "@/lib/cliente-agendamento";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AgendamentoDetalhe from "@/components/AgendamentoDetalhe";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "No-show",
  concluido: "Concluído",
};

const STATUS_CLASS: Record<string, string> = {
  pendente: "border-transparent bg-amber-500/15 text-amber-400",
  confirmado: "border-transparent bg-success/15 text-success",
  cancelado: "border-transparent bg-muted text-muted-foreground",
  no_show: "border-transparent bg-destructive/15 text-destructive",
  concluido: "border-transparent bg-gold/15 text-gold",
};

const selectClass =
  "h-9 rounded-lg border border-border bg-ink-soft px-3 text-sm text-foreground/90 focus:border-gold focus:outline-none";

export default function PainelAdminAgendamentos({
  agendamentos,
  barbeiros,
}: {
  agendamentos: any[];
  barbeiros: any[];
}) {
  const [lista, setLista] = useState(agendamentos);

  // O Next só re-renderiza esse componente com os dados novos do servidor
  // (ex: depois de marcar no-show/concluir pelo painel de detalhes e chamar
  // router.refresh()) - sem isso, o "lista" ficava congelado no valor inicial
  // e a tabela não refletia a mudança até recarregar a página inteira.
  useEffect(() => {
    setLista(agendamentos);
  }, [agendamentos]);

  const [filtroBarbeiro, setFiltroBarbeiro] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<"" | "avulso" | "manual">("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [agendamentoAbertoId, setAgendamentoAbertoId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const confirmar = useConfirmacao();

  const agendamentoAberto = lista.find((a) => a.id === agendamentoAbertoId) ?? null;

  const filtrados = useMemo(() => {
    return lista.filter((a) => {
      if (filtroBarbeiro && a.barbeiro_id !== filtroBarbeiro) return false;
      if (filtroStatus && a.status !== filtroStatus) return false;
      if (filtroData && !a.data_hora.startsWith(filtroData)) return false;
      if (filtroOrigem === "avulso" && !ehClienteAvulso(a)) return false;
      if (filtroOrigem === "manual" && !criadoPeloBarbeiro(a)) return false;
      return true;
    });
  }, [lista, filtroBarbeiro, filtroData, filtroStatus, filtroOrigem]);

  async function excluir(id: string) {
    const ok = await confirmar({
      titulo: "Excluir este agendamento?",
      descricao: "Essa ação não pode ser desfeita.",
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindoId(id);
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    setExcluindoId(null);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    setLista((prev) => prev.filter((a) => a.id !== id));
    toast.success("Agendamento excluído.");
    router.refresh();
  }

  async function alternarBloqueio(a: any) {
    const clienteId = a.clientes?.profile_id;
    if (!clienteId) return;
    const bloquear = !clienteBloqueadoAgendamento(a);
    if (bloquear) {
      const ok = await confirmar({
        titulo: `Bloquear ${nomeClienteAgendamento(a)}?`,
        descricao: "Ele não vai conseguir marcar novos horários pelo site.",
        confirmar: "Bloquear",
        destrutivo: true,
      });
      if (!ok) return;
    }
    const { error } = await supabase
      .from("clientes")
      .update(bloquear ? { bloqueado: true } : { bloqueado: false, motivo_bloqueio: null })
      .eq("profile_id", clienteId);
    if (error) {
      toast.error("Não foi possível alterar o bloqueio", { description: error.message });
      return;
    }
    toast.success(bloquear ? "Cliente bloqueado." : "Cliente desbloqueado.");
    setLista((prev) =>
      prev.map((item) =>
        item.clientes?.profile_id === clienteId
          ? { ...item, clientes: { ...item.clientes, bloqueado: bloquear } }
          : item
      )
    );
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroBarbeiro}
          onChange={(e) => setFiltroBarbeiro(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os barbeiros</option>
          {barbeiros.map((b) => (
            <option key={b.profile_id} value={b.profile_id}>
              {b.profiles?.nome}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="h-9 w-auto bg-ink-soft"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filtroOrigem}
          onChange={(e) => setFiltroOrigem(e.target.value as "" | "avulso" | "manual")}
          className={selectClass}
        >
          <option value="">Cliente cadastrado ou avulso</option>
          <option value="avulso">Só avulsos (sem cadastro)</option>
          <option value="manual">Só criados pelo barbeiro</option>
        </select>
      </div>

      <div className="scrollbar-thin mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-ink-soft hover:bg-ink-soft">
              <TableHead>Data/hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Barbeiro</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Serviço (R$)</TableHead>
              <TableHead className="text-right">Produtos</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Repasse Bruno</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((a) => (
              <TableRow
                key={a.id}
                onClick={() => setAgendamentoAbertoId(a.id)}
                className="cursor-pointer"
              >
                <TableCell className="text-muted-foreground">
                  {new Date(a.data_hora).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      {clienteBloqueadoAgendamento(a) && (
                        <ShieldOffIcon
                          className="size-3.5 shrink-0 text-destructive"
                          aria-label="Cliente bloqueado"
                        />
                      )}
                      {qtdNoShowAgendamento(a) > 0 && (
                        <AlertTriangleIcon
                          className="size-3.5 shrink-0 text-destructive"
                          aria-label={`Já não compareceu ${qtdNoShowAgendamento(a)}x antes`}
                        />
                      )}
                      {(a.comandas?.comanda_itens?.length ?? 0) > 0 && (
                        <ShoppingBagIcon
                          className="size-3.5 shrink-0 text-gold"
                          aria-label="Levou produtos da loja"
                        />
                      )}
                      {nomeClienteAgendamento(a)}
                    </span>
                    {ehClienteAvulso(a) && (
                      <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                        Avulso
                      </Badge>
                    )}
                    {criadoPeloBarbeiro(a) && (
                      <Badge
                        variant="outline"
                        className="border-sky-500/40 text-[10px] uppercase text-sky-400"
                        title="Criado manualmente pelo barbeiro no painel"
                      >
                        Manual
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {a.barbeiros?.profiles?.nome}
                  {a.barbeiros?.is_dono && (
                    <span className="ml-1 text-xs text-gold">(dono)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{a.servicos?.nome}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={cn("uppercase", STATUS_CLASS[a.status])}>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                    {a.comandas?.status === "fiado" && (
                      <Badge className="border-transparent bg-amber-500/15 uppercase text-amber-400">
                        Fiado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {Number(a.comandas?.valor_produtos ?? 0) > 0
                    ? `R$ ${Number(a.comandas.valor_produtos).toFixed(2).replace(".", ",")}`
                    : "—"}
                </TableCell>
                <TableCell
                  className="text-right font-mono font-semibold text-foreground"
                  title={
                    Number(a.comandas?.valor_debito_no_show ?? 0) > 0
                      ? `Inclui R$ ${Number(a.comandas.valor_debito_no_show).toFixed(2).replace(".", ",")} de débito de não comparecimento anterior`
                      : undefined
                  }
                >
                  R${" "}
                  {(
                    Number(a.valor_servico) +
                    Number(a.comandas?.valor_produtos ?? 0) +
                    Number(a.comandas?.valor_debito_no_show ?? 0)
                  )
                    .toFixed(2)
                    .replace(".", ",")}
                </TableCell>
                <TableCell className="text-right font-mono text-gold">
                  R$ {Number(a.valor_repasse_bruno).toFixed(2).replace(".", ",")}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-3">
                    {a.clientes?.profile_id && (
                      <button
                        onClick={() => alternarBloqueio(a)}
                        aria-label={clienteBloqueadoAgendamento(a) ? "Desbloquear cliente" : "Bloquear cliente"}
                        title={clienteBloqueadoAgendamento(a) ? "Desbloquear cliente" : "Bloquear cliente"}
                        className={cn(
                          "text-muted-foreground/70 disabled:opacity-50",
                          clienteBloqueadoAgendamento(a) ? "hover:text-success" : "hover:text-destructive"
                        )}
                      >
                        {clienteBloqueadoAgendamento(a) ? (
                          <ShieldCheckIcon className="size-3.5" />
                        ) : (
                          <ShieldOffIcon className="size-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => excluir(a.id)}
                      disabled={excluindoId === a.id}
                      aria-label="Excluir agendamento"
                      className="text-muted-foreground/70 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!agendamentoAbertoId} onOpenChange={(open) => !open && setAgendamentoAbertoId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do agendamento</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            {agendamentoAberto && (
              <AgendamentoDetalhe agendamento={agendamentoAberto} mostrarLinkComanda={false} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
