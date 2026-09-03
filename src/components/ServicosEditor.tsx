"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracao_minutos: number;
  imagem_url?: string | null;
};
type BarbeiroServico = {
  servico_id: string;
  ativo: boolean;
  preco_personalizado: number | null;
};

export default function ServicosEditor({
  barbeiroId,
  servicos,
  barbeiroServicosIniciais,
  isAdmin = false,
}: {
  barbeiroId: string;
  servicos: Servico[];
  barbeiroServicosIniciais: BarbeiroServico[];
  isAdmin?: boolean;
}) {
  const [linhas, setLinhas] = useState<BarbeiroServico[]>(
    servicos.map((s) => {
      const existente = barbeiroServicosIniciais.find((bs) => bs.servico_id === s.id);
      return (
        existente ?? { servico_id: s.id, ativo: false, preco_personalizado: null }
      );
    })
  );
  const [duracoes, setDuracoes] = useState<Record<string, number>>(() =>
    Object.fromEntries(servicos.map((s) => [s.id, s.duracao_minutos]))
  );
  const [precosBase, setPrecosBase] = useState<Record<string, number>>(() =>
    Object.fromEntries(servicos.map((s) => [s.id, Number(s.preco)]))
  );
  const [imagens, setImagens] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(servicos.map((s) => [s.id, s.imagem_url ?? null]))
  );
  const [trocandoImagemId, setTrocandoImagemId] = useState<string | null>(null);
  const inputsImagem = useRef<Record<string, HTMLInputElement | null>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function atualizar(servicoId: string, campo: keyof BarbeiroServico, valor: any) {
    setLinhas((prev) =>
      prev.map((l) => (l.servico_id === servicoId ? { ...l, [campo]: valor } : l))
    );
  }

  async function trocarImagem(servicoId: string, arquivo: File) {
    setTrocandoImagemId(servicoId);
    const path = `${servicoId}/${Date.now()}-${arquivo.name}`;
    const { error } = await supabase.storage.from("servicos").upload(path, arquivo, { upsert: true });
    if (!error) {
      const url = supabase.storage.from("servicos").getPublicUrl(path).data.publicUrl;
      await supabase.from("servicos").update({ imagem_url: url }).eq("id", servicoId);
      setImagens((prev) => ({ ...prev, [servicoId]: url }));
      router.refresh();
    }
    setTrocandoImagemId(null);
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    const payload = linhas.map((l) => ({
      barbeiro_id: barbeiroId,
      servico_id: l.servico_id,
      ativo: l.ativo,
      preco_personalizado: l.preco_personalizado,
    }));
    const { error } = await supabase
      .from("barbeiro_servicos")
      .upsert(payload, { onConflict: "barbeiro_id,servico_id" });

    if (!error && isAdmin) {
      const alterados = servicos.filter(
        (s) => duracoes[s.id] !== s.duracao_minutos || precosBase[s.id] !== Number(s.preco)
      );
      for (const s of alterados) {
        await supabase
          .from("servicos")
          .update({ duracao_minutos: duracoes[s.id], preco: precosBase[s.id] })
          .eq("id", s.id);
      }
    }

    setSalvando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setMensagem("Serviços atualizados!");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {servicos.map((s) => {
        const l = linhas.find((x) => x.servico_id === s.id)!;
        return (
          <Card
            key={s.id}
            className={cn(
              "flex-row flex-wrap items-center gap-4 border-border bg-ink-soft px-4 py-3",
              !l.ativo && "bg-ink-soft/40"
            )}
          >
            {isAdmin && (
              <button
                type="button"
                onClick={() => inputsImagem.current[s.id]?.click()}
                disabled={trocandoImagemId === s.id}
                aria-label={`Trocar foto de ${s.nome}`}
                className="group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background"
              >
                {imagens[s.id] ? (
                  <img src={imagens[s.id]!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-transparent transition-colors group-hover:bg-ink/60 group-hover:text-white">
                  <ImageIcon className="size-4" />
                </span>
                <input
                  ref={(el) => {
                    inputsImagem.current[s.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) trocarImagem(s.id, arquivo);
                    e.target.value = "";
                  }}
                />
              </button>
            )}

            <label className="flex w-44 items-center gap-2.5 text-sm font-semibold text-foreground/90">
              <Switch
                checked={l.ativo}
                onCheckedChange={(checked) => atualizar(s.id, "ativo", checked)}
              />
              {s.nome}
            </label>

            {isAdmin ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Input
                  type="number"
                  step="5"
                  min="5"
                  value={duracoes[s.id]}
                  onChange={(e) =>
                    setDuracoes((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                  }
                  className="w-20 bg-background"
                />
                <span>min</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{s.duracao_minutos} min</span>
            )}

            {isAdmin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Preço padrão R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precosBase[s.id]}
                  onChange={(e) =>
                    setPrecosBase((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                  }
                  className="w-28 bg-background"
                />
              </div>
            )}

            {l.ativo ? (
              isAdmin ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={String(precosBase[s.id])}
                    value={l.preco_personalizado ?? ""}
                    onChange={(e) =>
                      atualizar(
                        s.id,
                        "preco_personalizado",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className="w-28 bg-background"
                  />
                  <span className="text-xs text-muted-foreground">(preço deste barbeiro)</span>
                </div>
              ) : (
                <span className="font-mono text-sm text-muted-foreground">
                  R$ {Number(l.preco_personalizado ?? s.preco).toFixed(2).replace(".", ",")}
                  {l.preco_personalizado != null && " (personalizado pelo Bruno)"}
                </span>
              )
            ) : (
              <span className="text-sm text-muted-foreground">Não oferece este serviço</span>
            )}
          </Card>
        );
      })}

      {isAdmin && (
        <p className="text-xs text-muted-foreground">
          A duração é a mesma para todos os barbeiros que oferecem o serviço — muda a
          duração aqui afeta a agenda de todo mundo.
        </p>
      )}

      {mensagem && <p className="text-sm text-gold">{mensagem}</p>}

      <Button onClick={salvar} disabled={salvando} className="mt-2 w-fit uppercase tracking-widest">
        {salvando ? "Salvando..." : "Salvar serviços"}
      </Button>
    </div>
  );
}
