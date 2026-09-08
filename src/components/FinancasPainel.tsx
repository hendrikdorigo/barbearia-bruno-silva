"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcularResumoFinanceiro, formatarMes, mesAnterior, mesSeguinte, type AgendamentoFinanceiro } from "@/lib/financas";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const CATEGORIAS_SUGERIDAS = [
  "Aluguel",
  "Água/Luz/Internet",
  "Produtos e estoque",
  "Manutenção/Equipamentos",
  "Marketing",
  "Salários/Ajudante",
  "Impostos",
  "Outros",
];

type Despesa = {
  id: string;
  descricao: string;
  valor: number;
  categoria: string | null;
  data: string;
  observacao: string | null;
  profiles: { nome: string } | null;
};

function moeda(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function FinancasPainel({
  mes,
  meses,
  agendamentos,
  despesasIniciais,
}: {
  mes: string;
  meses: string[];
  agendamentos: AgendamentoFinanceiro[];
  despesasIniciais: Despesa[];
}) {
  const [despesas, setDespesas] = useState<Despesa[]>(despesasIniciais);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  const resumo = useMemo(() => calcularResumoFinanceiro(agendamentos, despesas), [agendamentos, despesas]);

  function irPara(novoMes: string) {
    router.push(`/painel/admin/financas?mes=${novoMes}`);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={() => irPara(mesAnterior(mes))} aria-label="Mês anterior">
          <ChevronLeftIcon />
        </Button>
        <Select value={mes} onValueChange={(v) => v && irPara(v)}>
          <SelectTrigger className="w-56 justify-center bg-ink-soft text-center">
            <SelectValue>{formatarMes(mes)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {meses.map((m) => (
              <SelectItem key={m} value={m}>
                {formatarMes(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => irPara(mesSeguinte(mes))} aria-label="Próximo mês">
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card className="gap-1 border-border bg-ink-soft p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingUpIcon className="size-3.5 text-success" />
            Faturamento
          </p>
          <p className="font-mono text-2xl font-medium text-foreground">{moeda(resumo.faturamento)}</p>
        </Card>
        <Card className="gap-1 border-border bg-ink-soft p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <WalletIcon className="size-3.5 text-gold" />
            Comissões de barbeiros
          </p>
          <p className="font-mono text-2xl font-medium text-foreground">- {moeda(resumo.comissoes)}</p>
        </Card>
        <Card className="gap-1 border-border bg-ink-soft p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingDownIcon className="size-3.5 text-destructive" />
            Despesas
          </p>
          <p className="font-mono text-2xl font-medium text-foreground">- {moeda(resumo.despesas)}</p>
        </Card>
      </div>

      <Card
        className={cn(
          "mt-3 gap-1 border-2 p-5",
          resumo.lucro >= 0 ? "border-success/50 bg-success/10" : "border-destructive/50 bg-destructive/10"
        )}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Lucro do mês</p>
        <p
          className={cn(
            "font-mono text-4xl font-medium",
            resumo.lucro >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {moeda(resumo.lucro)}
        </p>
      </Card>

      <NovaDespesaForm
        mes={mes}
        onCriada={(nova) => {
          setDespesas((prev) => [nova, ...prev].sort((a, b) => b.data.localeCompare(a.data)));
        }}
      />

      <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Despesas de {formatarMes(mes)}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {despesas.length === 0 && (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WalletIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma despesa lançada neste mês</EmptyTitle>
              <EmptyDescription>Use o formulário acima pra registrar a primeira.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {despesas.map((d) => (
          <LinhaDespesa
            key={d.id}
            despesa={d}
            onAtualizada={(atualizada) =>
              setDespesas((prev) => prev.map((x) => (x.id === atualizada.id ? atualizada : x)))
            }
            onExcluida={(id) => setDespesas((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function NovaDespesaForm({ mes, onCriada }: { mes: string; onCriada: (d: Despesa) => void }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState(hoje.slice(0, 7) === mes ? hoje : `${mes}-01`);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = createClient();

  async function salvar() {
    setErro(null);
    const numero = Number(valor);
    if (!descricao.trim() || !numero || numero <= 0 || !data) {
      setErro("Preencha descrição, valor e data.");
      return;
    }
    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: salvo, error } = await supabase
      .from("despesas")
      .insert({
        descricao: descricao.trim(),
        valor: numero,
        categoria: categoria.trim() || null,
        data,
        observacao: observacao.trim() || null,
        criado_por: userData.user!.id,
      })
      .select("*, profiles!despesas_criado_por_fkey(nome)")
      .single();
    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setDescricao("");
    setValor("");
    setCategoria("");
    setObservacao("");
    toast.success("Despesa lançada.");
    onCriada(salvo as any);
  }

  return (
    <Card className="mt-8 border-border bg-ink-soft p-5">
      <p className="text-sm font-semibold text-foreground">Nova despesa</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Descrição (ex: Aluguel de setembro)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="bg-background sm:col-span-2"
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="bg-background"
        />
        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="bg-background" />
        <Input
          list="categorias-despesa"
          placeholder="Categoria (opcional)"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="bg-background sm:col-span-2"
        />
        <datalist id="categorias-despesa">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Textarea
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          className="bg-background sm:col-span-2"
        />
      </div>
      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
      <Button onClick={salvar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
        <PlusIcon className="size-3.5" data-icon="inline-start" />
        {salvando ? "Salvando..." : "Lançar despesa"}
      </Button>
    </Card>
  );
}

function LinhaDespesa({
  despesa,
  onAtualizada,
  onExcluida,
}: {
  despesa: Despesa;
  onAtualizada: (d: Despesa) => void;
  onExcluida: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [descricao, setDescricao] = useState(despesa.descricao);
  const [valor, setValor] = useState(String(despesa.valor));
  const [categoria, setCategoria] = useState(despesa.categoria ?? "");
  const [data, setData] = useState(despesa.data);
  const [observacao, setObservacao] = useState(despesa.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const supabase = createClient();
  const confirmar = useConfirmacao();

  async function salvar() {
    const numero = Number(valor);
    if (!descricao.trim() || !numero || numero <= 0 || !data) return;
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("despesas")
      .update({
        descricao: descricao.trim(),
        valor: numero,
        categoria: categoria.trim() || null,
        data,
        observacao: observacao.trim() || null,
      })
      .eq("id", despesa.id)
      .select("*, profiles!despesas_criado_por_fkey(nome)")
      .single();
    setSalvando(false);
    if (error || !salvo) {
      toast.error("Não foi possível salvar", { description: error?.message });
      return;
    }
    onAtualizada(salvo as any);
    setEditando(false);
    toast.success("Despesa atualizada.");
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir "${despesa.descricao}"?`,
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindo(true);
    const { error } = await supabase.from("despesas").delete().eq("id", despesa.id);
    setExcluindo(false);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    onExcluida(despesa.id);
    toast.success("Despesa excluída.");
  }

  if (editando) {
    return (
      <Card className="border-gold/40 bg-ink-soft p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="bg-background sm:col-span-2" />
          <Input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="bg-background" />
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="bg-background" />
          <Input
            list="categorias-despesa"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-background sm:col-span-2"
          />
          <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} className="bg-background sm:col-span-2" />
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={salvar} disabled={salvando} className="uppercase tracking-widest">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditando(false)} className="uppercase tracking-widest">
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft p-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
          {despesa.descricao}
          {despesa.categoria && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-normal uppercase tracking-widest text-muted-foreground">
              {despesa.categoria}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(`${despesa.data}T12:00:00`).toLocaleDateString("pt-BR")} · lançado por{" "}
          {despesa.profiles?.nome ?? "Equipe"}
          {despesa.observacao && ` · ${despesa.observacao}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-lg font-semibold text-foreground">{moeda(Number(despesa.valor))}</p>
        <button onClick={() => setEditando(true)} aria-label="Editar despesa" className="text-muted-foreground/70 hover:text-gold">
          <PencilIcon className="size-4" />
        </button>
        <button
          onClick={excluir}
          disabled={excluindo}
          aria-label="Excluir despesa"
          className="text-muted-foreground/70 hover:text-destructive disabled:opacity-50"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </Card>
  );
}
