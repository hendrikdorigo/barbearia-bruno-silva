"use client";

import { useState } from "react";
import ServicosEditor from "@/components/ServicosEditor";
import AjustesPrecoEditor from "@/components/AjustesPrecoEditor";
import FidelidadeEditor from "@/components/FidelidadeEditor";

const selectClass =
  "h-10 rounded-lg border border-border bg-ink-soft px-3 text-sm text-foreground/90 focus:border-gold focus:outline-none";

type Barbeiro = { profile_id: string; nome: string; is_dono: boolean };
type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };

export default function GestaoPrecosBarbeiro({
  barbeiros,
  servicos,
  barbeiroServicos,
  ajustes,
  fidelidadeConfigs,
}: {
  barbeiros: Barbeiro[];
  servicos: Servico[];
  barbeiroServicos: any[];
  ajustes: any[];
  fidelidadeConfigs: any[];
}) {
  const [barbeiroId, setBarbeiroId] = useState(barbeiros[0]?.profile_id ?? "");

  return (
    <div className="mt-6">
      <label className="text-xs uppercase tracking-widest text-muted-foreground">Barbeiro</label>
      <select
        value={barbeiroId}
        onChange={(e) => setBarbeiroId(e.target.value)}
        className={`${selectClass} mt-2 w-full sm:w-auto`}
      >
        {barbeiros.map((b) => (
          <option key={b.profile_id} value={b.profile_id}>
            {b.nome}
            {b.is_dono ? " (dono)" : ""}
          </option>
        ))}
      </select>

      <h2 className="mt-10 font-display text-2xl tracking-wide text-foreground">Serviços e preços</h2>
      <ServicosEditor
        key={`servicos-${barbeiroId}`}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiroServicosIniciais={barbeiroServicos.filter((bs) => bs.barbeiro_id === barbeiroId)}
        isAdmin
      />

      <h2 className="mt-14 font-display text-2xl tracking-wide text-foreground">Acréscimos e descontos</h2>
      <p className="mt-2 text-muted-foreground">
        Regras automáticas de acréscimo ou desconto pra esse barbeiro, por período de datas ou dia
        da semana fixo.
      </p>
      <AjustesPrecoEditor
        key={`ajustes-${barbeiroId}`}
        barbeiroId={barbeiroId}
        servicos={servicos}
        ajustesIniciais={ajustes.filter((a) => a.barbeiro_id === barbeiroId)}
      />

      <h2 className="mt-14 font-display text-2xl tracking-wide text-foreground">Fidelidade</h2>
      <p className="mt-2 text-muted-foreground">
        Conquistas automáticas pra clientes desse barbeiro: a cada X atendimentos, ganham um prêmio.
      </p>
      <FidelidadeEditor
        key={`fidelidade-${barbeiroId}`}
        barbeiroId={barbeiroId}
        configsIniciais={fidelidadeConfigs.filter((c) => c.barbeiro_id === barbeiroId)}
      />
    </div>
  );
}
