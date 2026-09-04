"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Ajuste = {
  forma_pagamento: FormaPagamento;
  ativo: boolean;
  tipo: "desconto" | "acrescimo";
  valor_tipo: "percentual" | "fixo";
  valor: number;
};

export default function AjustesFormaPagamentoEditor({ ajustesIniciais }: { ajustesIniciais: Ajuste[] }) {
  const [ajustes, setAjustes] = useState(ajustesIniciais);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function atualizarLocal(forma: FormaPagamento, patch: Partial<Ajuste>) {
    setAjustes((prev) => prev.map((a) => (a.forma_pagamento === forma ? { ...a, ...patch } : a)));
  }

  async function salvar(forma: FormaPagamento) {
    const a = ajustes.find((x) => x.forma_pagamento === forma);
    if (!a) return;
    setSalvandoId(forma);
    await supabase
      .from("ajustes_forma_pagamento")
      .update({ ativo: a.ativo, tipo: a.tipo, valor_tipo: a.valor_tipo, valor: a.valor })
      .eq("forma_pagamento", forma);
    setSalvandoId(null);
    router.refresh();
  }

  return (
    <Card className="mt-4 border-border bg-ink-soft p-5">
      <p className="text-sm text-muted-foreground">
        Ajuste o valor final conforme a forma de pagamento escolhida (ex: desconto no
        dinheiro pra evitar taxa de cartão). Aplica automaticamente no valor do serviço
        na hora que o cliente agenda pelo site.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {FORMAS_PAGAMENTO.map((f) => {
          const a = ajustes.find((x) => x.forma_pagamento === f.id);
          if (!a) return null;
          return (
            <div key={f.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{f.label}</p>
                <Switch
                  checked={a.ativo}
                  onCheckedChange={(v) => atualizarLocal(f.id, { ativo: v })}
                />
              </div>
              {a.ativo && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-border p-0.5">
                    {(["desconto", "acrescimo"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => atualizarLocal(f.id, { tipo: t })}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold capitalize",
                          a.tipo === t ? "bg-gold-gradient text-ink" : "text-muted-foreground"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex rounded-lg border border-border p-0.5">
                    {(["percentual", "fixo"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => atualizarLocal(f.id, { valor_tipo: t })}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold",
                          a.valor_tipo === t ? "bg-gold-gradient text-ink" : "text-muted-foreground"
                        )}
                      >
                        {t === "percentual" ? "%" : "R$"}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={a.valor}
                    onChange={(e) => atualizarLocal(f.id, { valor: Number(e.target.value) })}
                    className="w-24 bg-background"
                  />
                </div>
              )}
              <Button
                onClick={() => salvar(f.id)}
                disabled={salvandoId === f.id}
                size="sm"
                variant="outline"
                className="mt-3 w-fit uppercase tracking-widest"
              >
                {salvandoId === f.id ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
