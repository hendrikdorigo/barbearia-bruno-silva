"use client";

import { useMemo, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "No-show",
  concluido: "Concluído",
};

export default function PainelAdminAgendamentos({
  agendamentos,
  barbeiros,
}: {
  agendamentos: any[];
  barbeiros: any[];
}) {
  const [filtroBarbeiro, setFiltroBarbeiro] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const filtrados = useMemo(() => {
    return agendamentos.filter((a) => {
      if (filtroBarbeiro && a.barbeiro_id !== filtroBarbeiro) return false;
      if (filtroStatus && a.status !== filtroStatus) return false;
      if (filtroData && !a.data_hora.startsWith(filtroData)) return false;
      return true;
    });
  }, [agendamentos, filtroBarbeiro, filtroData, filtroStatus]);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroBarbeiro}
          onChange={(e) => setFiltroBarbeiro(e.target.value)}
          className="rounded-lg border border-border bg-ink-soft px-3 py-2 text-sm text-foreground/90"
        >
          <option value="">Todos os barbeiros</option>
          {barbeiros.map((b) => (
            <option key={b.profile_id} value={b.profile_id}>
              {b.profiles?.nome}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="rounded-lg border border-border bg-ink-soft px-3 py-2 text-sm text-foreground/90"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-border bg-ink-soft px-3 py-2 text-sm text-foreground/90"
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
        <table className="w-full text-sm">
          <thead className="bg-ink-soft text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Data/hora</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Barbeiro</th>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Repasse Bruno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.map((a) => (
              <tr key={a.id} className="text-muted-foreground">
                <td className="px-4 py-3">
                  {new Date(a.data_hora).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3">{a.clientes?.profiles?.nome}</td>
                <td className="px-4 py-3">
                  {a.barbeiros?.profiles?.nome}
                  {a.barbeiros?.is_dono && (
                    <span className="ml-1 text-xs text-gold">(dono)</span>
                  )}
                </td>
                <td className="px-4 py-3">{a.servicos?.nome}</td>
                <td className="px-4 py-3">{STATUS_LABEL[a.status]}</td>
                <td className="px-4 py-3">
                  R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")}
                </td>
                <td className="px-4 py-3 text-gold">
                  R$ {Number(a.valor_repasse_bruno).toFixed(2).replace(".", ",")}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
