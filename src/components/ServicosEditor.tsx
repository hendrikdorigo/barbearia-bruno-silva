"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import ImageCropper from "@/components/ImageCropper";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { cn } from "@/lib/utils";

type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracao_minutos: number;
  imagem_url?: string | null;
  ativo?: boolean;
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
  const [listaServicos, setListaServicos] = useState<Servico[]>(servicos);
  const [linhas, setLinhas] = useState<BarbeiroServico[]>(
    servicos.map((s) => {
      const existente = barbeiroServicosIniciais.find((bs) => bs.servico_id === s.id);
      return (
        existente ?? { servico_id: s.id, ativo: false, preco_personalizado: null }
      );
    })
  );
  const [nomes, setNomes] = useState<Record<string, string>>(() =>
    Object.fromEntries(servicos.map((s) => [s.id, s.nome]))
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
  const [recorteAberto, setRecorteAberto] = useState<{ servicoId: string; file: File } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [novaDuracao, setNovaDuracao] = useState("30");
  const [criando, setCriando] = useState(false);
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  const [alternandoAtivoId, setAlternandoAtivoId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  function atualizar(servicoId: string, campo: keyof BarbeiroServico, valor: any) {
    setLinhas((prev) =>
      prev.map((l) => (l.servico_id === servicoId ? { ...l, [campo]: valor } : l))
    );
  }

  async function criarServico() {
    setErroNovo(null);
    if (!novoNome.trim() || !novoPreco) {
      setErroNovo("Preencha nome e preço.");
      return;
    }
    setCriando(true);
    const { data: salvo, error } = await supabase
      .from("servicos")
      .insert({
        nome: novoNome.trim(),
        preco: Number(novoPreco),
        duracao_minutos: Number(novaDuracao) || 30,
      })
      .select("id, nome, preco, duracao_minutos, imagem_url, ativo")
      .single();
    setCriando(false);
    if (error || !salvo) {
      setErroNovo(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setListaServicos((prev) => [...prev, salvo as Servico]);
    setNomes((prev) => ({ ...prev, [salvo.id]: salvo.nome }));
    setDuracoes((prev) => ({ ...prev, [salvo.id]: salvo.duracao_minutos }));
    setPrecosBase((prev) => ({ ...prev, [salvo.id]: Number(salvo.preco) }));
    setImagens((prev) => ({ ...prev, [salvo.id]: salvo.imagem_url ?? null }));
    setLinhas((prev) => [...prev, { servico_id: salvo.id, ativo: false, preco_personalizado: null }]);
    setNovoNome("");
    setNovoPreco("");
    setNovaDuracao("30");
    toast.success("Serviço criado. Ative-o abaixo pra passar a oferecer.");
    router.refresh();
  }

  async function alternarAtivoServico(servico: Servico) {
    const desativando = servico.ativo !== false;
    if (desativando) {
      const ok = await confirmar({
        titulo: `Remover "${servico.nome}" do catálogo?`,
        descricao: "Ele deixa de aparecer pra clientes e barbeiros escolherem, mas o histórico de agendamentos antigos com esse serviço continua intacto.",
        confirmar: "Remover",
        destrutivo: true,
      });
      if (!ok) return;
    }
    setAlternandoAtivoId(servico.id);
    const { error } = await supabase
      .from("servicos")
      .update({ ativo: !desativando })
      .eq("id", servico.id);
    setAlternandoAtivoId(null);
    if (error) {
      toast.error("Não foi possível atualizar", { description: error.message });
      return;
    }
    setListaServicos((prev) =>
      prev.map((s) => (s.id === servico.id ? { ...s, ativo: !desativando } : s))
    );
    toast.success(desativando ? "Serviço removido do catálogo." : "Serviço reativado.");
    router.refresh();
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
    if (isAdmin && listaServicos.some((s) => !nomes[s.id]?.trim())) {
      setMensagem("O nome do serviço não pode ficar em branco.");
      return;
    }
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
      const alterados = listaServicos.filter(
        (s) =>
          duracoes[s.id] !== s.duracao_minutos ||
          precosBase[s.id] !== Number(s.preco) ||
          nomes[s.id] !== s.nome
      );
      for (const s of alterados) {
        await supabase
          .from("servicos")
          .update({ duracao_minutos: duracoes[s.id], preco: precosBase[s.id], nome: nomes[s.id] })
          .eq("id", s.id);
      }
      if (alterados.length > 0) {
        setListaServicos((prev) =>
          prev.map((s) => ({ ...s, nome: nomes[s.id], duracao_minutos: duracoes[s.id], preco: precosBase[s.id] }))
        );
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
      {isAdmin && (
        <Card className="border-border bg-ink-soft p-5">
          <p className="text-sm font-semibold text-foreground">Novo serviço</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Nome do serviço"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="bg-background sm:col-span-1"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Preço padrão"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
              className="bg-background"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="5"
                step="5"
                value={novaDuracao}
                onChange={(e) => setNovaDuracao(e.target.value)}
                className="bg-background"
              />
              <span className="shrink-0 text-sm text-muted-foreground">min</span>
            </div>
          </div>
          {erroNovo && <p className="mt-2 text-sm text-destructive">{erroNovo}</p>}
          <Button onClick={criarServico} disabled={criando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
            {criando ? "Criando..." : "Criar serviço"}
          </Button>
        </Card>
      )}

      {listaServicos.map((s) => {
        const l = linhas.find((x) => x.servico_id === s.id)!;
        const removido = s.ativo === false;
        return (
          <Card
            key={s.id}
            className={cn(
              "flex-row flex-wrap items-center gap-4 border-border bg-ink-soft px-4 py-3",
              (!l.ativo || removido) && "bg-ink-soft/40"
            )}
          >
            {isAdmin && (
              <button
                type="button"
                onClick={() => inputsImagem.current[s.id]?.click()}
                disabled={trocandoImagemId === s.id || removido}
                aria-label={`Trocar foto de ${s.nome}`}
                className="group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background disabled:opacity-50"
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
                    if (arquivo) setRecorteAberto({ servicoId: s.id, file: arquivo });
                    e.target.value = "";
                  }}
                />
              </button>
            )}

            {isAdmin ? (
              <label className="flex w-52 items-center gap-2.5 text-sm font-semibold text-foreground/90">
                <Switch
                  checked={l.ativo}
                  disabled={removido}
                  onCheckedChange={(checked) => atualizar(s.id, "ativo", checked)}
                />
                <Input
                  value={nomes[s.id]}
                  disabled={removido}
                  onChange={(e) => setNomes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="h-8 bg-background"
                />
              </label>
            ) : (
              <label className="flex w-44 items-center gap-2.5 text-sm font-semibold text-foreground/90">
                <Switch
                  checked={l.ativo}
                  onCheckedChange={(checked) => atualizar(s.id, "ativo", checked)}
                />
                {s.nome}
              </label>
            )}

            {isAdmin ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Input
                  type="number"
                  step="5"
                  min="5"
                  disabled={removido}
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
                  disabled={removido}
                  value={precosBase[s.id]}
                  onChange={(e) =>
                    setPrecosBase((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                  }
                  className="w-28 bg-background"
                />
              </div>
            )}

            {removido ? (
              <span className="text-sm text-destructive">Removido do catálogo</span>
            ) : l.ativo ? (
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

            {isAdmin && (
              <button
                onClick={() => alternarAtivoServico(s)}
                disabled={alternandoAtivoId === s.id}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "ml-auto rounded-full",
                  removido
                    ? "border-success/40 text-success hover:bg-success/10"
                    : "border-destructive/40 text-destructive hover:bg-destructive/10"
                )}
              >
                {removido ? "Reativar" : "Remover"}
              </button>
            )}
          </Card>
        );
      })}

      {isAdmin && (
        <p className="text-xs text-muted-foreground">
          A duração é a mesma para todos os barbeiros que oferecem o serviço — muda a
          duração aqui afeta a agenda de todo mundo. Remover um serviço só tira ele do
          catálogo (agendamentos antigos com ele continuam intactos).
        </p>
      )}

      {mensagem && <p className="text-sm text-gold">{mensagem}</p>}

      <Button onClick={salvar} disabled={salvando} className="mt-2 w-fit uppercase tracking-widest">
        {salvando ? "Salvando..." : "Salvar serviços"}
      </Button>

      {recorteAberto && (
        <ImageCropper
          file={recorteAberto.file}
          aspecto={4 / 3}
          salvando={trocandoImagemId === recorteAberto.servicoId}
          onCancel={() => setRecorteAberto(null)}
          onCrop={async (arquivo) => {
            await trocarImagem(recorteAberto.servicoId, arquivo);
            setRecorteAberto(null);
          }}
        />
      )}
    </div>
  );
}
