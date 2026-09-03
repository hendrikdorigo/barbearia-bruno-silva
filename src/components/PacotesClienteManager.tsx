"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DIAS_SEMANA_ABREV, pacoteVigente, textoDiasSemana, type PacoteCliente } from "@/lib/pacotes-cliente";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClienteEncontrado = { id: string; nome: string; telefone: string | null };

const PACOTE_VAZIO = {
  nome: "",
  dias: [] as number[],
  observacoes: "",
  dataInicio: "",
  dataFim: "",
};

export default function PacotesClienteManager({ autorId }: { autorId: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ClienteEncontrado[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteEncontrado | null>(null);
  const [pacotes, setPacotes] = useState<PacoteCliente[]>([]);
  const [carregandoPacotes, setCarregandoPacotes] = useState(false);

  const [form, setForm] = useState(PACOTE_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (busca.trim().length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, telefone")
        .eq("role", "cliente")
        .ilike("nome", `%${busca.trim()}%`)
        .limit(8);
      setResultados(data ?? []);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  async function selecionarCliente(c: ClienteEncontrado) {
    setClienteSelecionado(c);
    setBusca("");
    setResultados([]);
    setForm(PACOTE_VAZIO);
    setEditandoId(null);
    setCarregandoPacotes(true);
    const { data } = await supabase
      .from("pacotes_cliente")
      .select("*")
      .eq("cliente_id", c.id)
      .order("created_at", { ascending: false });
    setPacotes((data ?? []) as any);
    setCarregandoPacotes(false);
  }

  function alternarDia(dia: number) {
    setForm((prev) => ({
      ...prev,
      dias: prev.dias.includes(dia) ? prev.dias.filter((d) => d !== dia) : [...prev.dias, dia].sort(),
    }));
  }

  function editar(p: PacoteCliente) {
    setEditandoId(p.id);
    setForm({
      nome: p.nome,
      dias: p.dias_semana ?? [],
      observacoes: p.observacoes ?? "",
      dataInicio: p.data_inicio ?? "",
      dataFim: p.data_fim ?? "",
    });
  }

  async function salvar() {
    if (!clienteSelecionado) return;
    setErro(null);
    if (!form.nome.trim()) {
      setErro("Dê um nome pro pacote (ex: Assinatura Mensal).");
      return;
    }
    setSalvando(true);
    const payload = {
      nome: form.nome.trim(),
      dias_semana: form.dias.length > 0 ? form.dias : null,
      observacoes: form.observacoes.trim() || null,
      data_inicio: form.dataInicio || null,
      data_fim: form.dataFim || null,
    };

    if (editandoId) {
      const { error } = await supabase.from("pacotes_cliente").update(payload).eq("id", editandoId);
      setSalvando(false);
      if (error) {
        setErro(error.message);
        return;
      }
      setPacotes((prev) =>
        prev.map((p) => (p.id === editandoId ? ({ ...p, ...payload } as any) : p))
      );
    } else {
      const { data, error } = await supabase
        .from("pacotes_cliente")
        .insert({ ...payload, cliente_id: clienteSelecionado.id, criado_por: autorId })
        .select()
        .single();
      setSalvando(false);
      if (error || !data) {
        setErro(error?.message ?? "Não foi possível salvar.");
        return;
      }
      setPacotes((prev) => [data as any, ...prev]);
    }
    setForm(PACOTE_VAZIO);
    setEditandoId(null);
    router.refresh();
  }

  async function alternarAtivo(p: PacoteCliente) {
    await supabase.from("pacotes_cliente").update({ ativo: !p.ativo }).eq("id", p.id);
    setPacotes((prev) => prev.map((x) => (x.id === p.id ? { ...x, ativo: !x.ativo } : x)));
    router.refresh();
  }

  async function remover(id: string) {
    if (!window.confirm("Remover esse pacote? Essa ação não pode ser desfeita.")) return;
    await supabase.from("pacotes_cliente").delete().eq("id", id);
    setPacotes((prev) => prev.filter((p) => p.id !== id));
    if (editandoId === id) {
      setEditandoId(null);
      setForm(PACOTE_VAZIO);
    }
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Cliente</p>
        {clienteSelecionado ? (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
            <span className="text-foreground">{clienteSelecionado.nome}</span>
            <button
              onClick={() => {
                setClienteSelecionado(null);
                setPacotes([]);
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Trocar
            </button>
          </div>
        ) : (
          <>
            <Input
              placeholder="Buscar cliente por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mt-2 bg-background"
            />
            {resultados.length > 0 && (
              <div className="mt-1.5 flex flex-col gap-1 rounded-lg border border-border bg-ink-soft p-1.5">
                {resultados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selecionarCliente(c)}
                    className="rounded-md px-2 py-1.5 text-left text-sm text-foreground/90 hover:bg-gold/10"
                  >
                    {c.nome}
                    {c.telefone && <span className="ml-2 text-xs text-muted-foreground">{c.telefone}</span>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {clienteSelecionado && (
        <>
          <div className="mt-6">
            {carregandoPacotes ? (
              <p className="text-sm text-muted-foreground">Carregando pacotes...</p>
            ) : pacotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Esse cliente ainda não tem nenhum pacote.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pacotes.map((p) => (
                  <Card key={p.id} className={cn("border-border bg-ink-soft p-4", !p.ativo && "opacity-60")}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{p.nome}</p>
                      <Badge variant="outline" className={pacoteVigente(p) ? "text-success" : "text-muted-foreground"}>
                        {p.ativo ? (pacoteVigente(p) ? "Vigente" : "Fora da validade") : "Inativo"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Válido: {textoDiasSemana(p.dias_semana)}
                      {(p.data_inicio || p.data_fim) && (
                        <>
                          {" · "}
                          {p.data_inicio ? new Date(`${p.data_inicio}T00:00:00`).toLocaleDateString("pt-BR") : "sem início"}
                          {" até "}
                          {p.data_fim ? new Date(`${p.data_fim}T00:00:00`).toLocaleDateString("pt-BR") : "sem fim"}
                        </>
                      )}
                    </p>
                    {p.observacoes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{p.observacoes}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => editar(p)}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarAtivo(p)}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "rounded-full",
                          p.ativo
                            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                            : "border-success/40 text-success hover:bg-success/10"
                        )}
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => remover(p.id)}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "rounded-full hover:border-destructive/50 hover:text-destructive"
                        )}
                      >
                        Remover
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="mt-6 border-border bg-ink-soft p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <PackageIcon className="size-4" />
              {editandoId ? "Editar pacote" : "Novo pacote"}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Input
                placeholder="Nome do pacote (ex: Assinatura Mensal Ilimitada)"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                className="bg-background"
              />

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Dias da semana válidos (deixe vazio pra todos os dias)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIAS_SEMANA_ABREV.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => alternarDia(i)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                        form.dias.includes(i)
                          ? "border-gold bg-gold-gradient text-ink"
                          : "border-border text-muted-foreground hover:border-gold"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Início (opcional)</p>
                  <Input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm((prev) => ({ ...prev, dataInicio: e.target.value }))}
                    className="mt-1.5 bg-background"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Fim (opcional)</p>
                  <Input
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => setForm((prev) => ({ ...prev, dataFim: e.target.value }))}
                    className="mt-1.5 bg-background"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Observações (como funciona o pagamento, o que está incluso, etc.)
                </p>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Ex: Pagamento de R$ 150 no início de cada mês via Pix. Inclui corte + barba ilimitados, exceto feriados. Renovação automática até avisar o cancelamento."
                  className="mt-1.5 bg-background"
                  rows={4}
                />
              </div>

              {erro && <p className="text-sm text-destructive">{erro}</p>}

              <div className="flex gap-2">
                <Button onClick={salvar} disabled={salvando} size="sm" className="w-fit uppercase tracking-widest">
                  {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Criar pacote"}
                </Button>
                {editandoId && (
                  <Button
                    onClick={() => {
                      setEditandoId(null);
                      setForm(PACOTE_VAZIO);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-fit uppercase tracking-widest"
                  >
                    Cancelar edição
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
