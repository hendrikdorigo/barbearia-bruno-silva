"use client";

import { useMemo, useState } from "react";
import { AlertTriangleIcon, Trash2Icon, ShieldOffIcon, ShieldCheckIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  nomeClienteAgendamento,
  qtdNoShowAgendamento,
  clienteBloqueadoAgendamento,
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
  const [filtroBarbeiro, setFiltroBarbeiro] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const supabase = createClient();

  const filtrados = useMemo(() => {
    return lista.filter((a) => {
      if (filtroBarbeiro && a.barbeiro_id !== filtroBarbeiro) return false;
      if (filtroStatus && a.status !== filtroStatus) return false;
      if (filtroData && !a.data_hora.startsWith(filtroData)) return false;
      return true;
    });
  }, [lista, filtroBarbeiro, filtroData, filtroStatus]);

  async function excluir(id: string) {
    if (!window.confirm("Excluir este agendamento? Essa ação não pode ser desfeita.")) return;
    setExcluindoId(id);
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    setExcluindoId(null);
    if (error) return;
    setLista((prev) => prev.filter((a) => a.id !== id));
  }

  async function alternarBloqueio(a: any) {
    const clienteId = a.clientes?.profile_id;
    if (!clienteId) return;
    const bloquear = !clienteBloqueadoAgendamento(a);
    if (bloquear && !window.confirm(`Bloquear ${nomeClienteAgendamento(a)}? Ele não vai conseguir marcar novos horários pelo site.`)) {
      return;
    }
    const { error } = await supabase
      .from("clientes")
      .update(bloquear ? { bloqueado: true } : { bloqueado: false, motivo_bloqueio: null })
      .eq("profile_id", clienteId);
    if (error) return;
    setLista((prev) =>
      prev.map((item) =>
        item.clientes?.profile_id === clienteId
          ? { ...item, clientes: { ...item.clientes, bloqueado: bloquear } }
          : item
      )
    );
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
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-ink-soft hover:bg-ink-soft">
              <TableHead>Data/hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Barbeiro</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Repasse Bruno</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(a.data_hora).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
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
                    {nomeClienteAgendamento(a)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {a.barbeiros?.profiles?.nome}
                  {a.barbeiros?.is_dono && (
                    <span className="ml-1 text-xs text-gold">(dono)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{a.servicos?.nome}</TableCell>
                <TableCell>
                  <Badge className={cn("uppercase", STATUS_CLASS[a.status])}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")}
                </TableCell>
                <TableCell className="text-right font-mono text-gold">
                  R$ {Number(a.valor_repasse_bruno).toFixed(2).replace(".", ",")}
                </TableCell>
                <TableCell className="text-right">
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
                <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
