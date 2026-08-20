"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DescontoAntecipadoEditor({
  configId,
  descontoInicial,
}: {
  configId: string;
  descontoInicial: number;
}) {
  const [desconto, setDesconto] = useState(String(descontoInicial));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function salvar() {
    setErro(null);
    setSalvo(false);
    const valor = Number(desconto);
    if (Number.isNaN(valor) || valor < 0 || valor > 100) {
      setErro("Informe um percentual entre 0 e 100.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("configuracoes_pagamento")
      .update({ desconto_pagamento_antecipado_percentual: valor, updated_at: new Date().toISOString() })
      .eq("id", configId);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setSalvo(true);
    router.refresh();
  }

  return (
    <Card className="mt-4 border-border bg-ink-soft p-5">
      <p className="text-sm text-muted-foreground">
        Quando o cliente escolhe pagar antecipado (Pix, na hora de agendar), esse
        percentual de desconto é aplicado no valor do serviço e mostrado pra ele
        na etapa de escolher a forma de pagamento. Deixe em 0 para não dar
        desconto nenhum.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={desconto}
          onChange={(e) => {
            setDesconto(e.target.value);
            setSalvo(false);
          }}
          className="w-28 bg-background"
        />
        <span className="text-sm text-muted-foreground">% de desconto</span>
      </div>
      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
      {salvo && !erro && <p className="mt-2 text-sm text-success">Salvo!</p>}
      <Button onClick={salvar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
        {salvando ? "Salvando..." : "Salvar"}
      </Button>
    </Card>
  );
}
