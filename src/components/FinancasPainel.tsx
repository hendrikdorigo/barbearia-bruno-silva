"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeCheckIcon,
  BadgeXIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDollarSignIcon,
  LightbulbIcon,
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

type Retirada = {
  id: string;
  valor: number;
  data: string;
  observacao: string | null;
  profiles: { nome: string } | null;
};

const STATUS_INVESTIMENTO_LABEL: Record<string, string> = {
  em_analise: "Em análise",
  aprovado: "Aprovado",
  descartado: "Descartado",
};

const STATUS_INVESTIMENTO_CLASS: Record<string, string> = {
  em_analise: "border-transparent bg-amber-500/15 text-amber-400",
  aprovado: "border-transparent bg-success/15 text-success",
  descartado: "border-transparent bg-muted text-muted-foreground",
};

type Investimento = {
  id: string;
  nome: string;
  custo_estimado: number | null;
  observacoes: string | null;
  status: string;
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
  retiradasIniciais,
  investimentosIniciais,
}: {
  mes: string;
  meses: string[];
  agendamentos: AgendamentoFinanceiro[];
  despesasIniciais: Despesa[];
  retiradasIniciais: Retirada[];
  investimentosIniciais: Investimento[];
}) {
  const [despesas, setDespesas] = useState<Despesa[]>(despesasIniciais);
  const [retiradas, setRetiradas] = useState<Retirada[]>(retiradasIniciais);
  const [investimentos, setInvestimentos] = useState<Investimento[]>(investimentosIniciais);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  const resumo = useMemo(
    () => calcularResumoFinanceiro(agendamentos, despesas, retiradas),
    [agendamentos, despesas, retiradas]
  );

  // Sincroniza com o servidor quando o mês muda (navegação troca as props,
  // mas o componente client continua montado - sem isso, a lista antiga
  // ficava presa na tela até um refresh manual).
  useEffect(() => setDespesas(despesasIniciais), [despesasIniciais]);
  useEffect(() => setRetiradas(retiradasIniciais), [retiradasIniciais]);

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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <Card className="gap-1 border-border bg-ink-soft p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <CircleDollarSignIcon className="size-3.5 text-destructive" />
            Seu salário retirado
          </p>
          <p className="font-mono text-2xl font-medium text-foreground">- {moeda(resumo.salario)}</p>
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
        <p className="mt-1 text-xs text-muted-foreground">
          Faturamento menos comissões, despesas e seu salário já retirado - o que sobra de fato no caixa.
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

      <p className="mt-14 font-display text-2xl text-foreground">Meu salário</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Registre aqui quanto você retirou de salário/pró-labore - isso entra como desconto
        no lucro do mês e fica guardado como histórico.
      </p>

      <NovaRetiradaForm
        mes={mes}
        onCriada={(nova) => {
          setRetiradas((prev) => [nova, ...prev].sort((a, b) => b.data.localeCompare(a.data)));
        }}
      />

      <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Retiradas de {formatarMes(mes)}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {retiradas.length === 0 && (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleDollarSignIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma retirada lançada neste mês</EmptyTitle>
              <EmptyDescription>Use o formulário acima quando tirar seu salário.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {retiradas.map((r) => (
          <LinhaRetirada
            key={r.id}
            retirada={r}
            onAtualizada={(atualizada) =>
              setRetiradas((prev) => prev.map((x) => (x.id === atualizada.id ? atualizada : x)))
            }
            onExcluida={(id) => setRetiradas((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </div>

      <p className="mt-14 font-display text-2xl text-foreground">Prospecção de investimentos</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Ideias de investimento futuro pra planejar (reforma, equipamento, nova unidade etc.) -
        essa lista não é mensal, fica sempre disponível independente do mês selecionado acima.
      </p>

      <NovoInvestimentoForm
        onCriado={(novo) => setInvestimentos((prev) => [novo, ...prev])}
      />

      <div className="mt-8 flex flex-col gap-2">
        {investimentos.length === 0 && (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LightbulbIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhum investimento em prospecção</EmptyTitle>
              <EmptyDescription>Use o formulário acima pra registrar a primeira ideia.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {investimentos.map((inv) => (
          <LinhaInvestimento
            key={inv.id}
            investimento={inv}
            onAtualizado={(atualizado) =>
              setInvestimentos((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)))
            }
            onExcluido={(id) => setInvestimentos((prev) => prev.filter((x) => x.id !== id))}
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

function NovaRetiradaForm({ mes, onCriada }: { mes: string; onCriada: (r: Retirada) => void }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje.slice(0, 7) === mes ? hoje : `${mes}-01`);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = createClient();

  async function salvar() {
    setErro(null);
    const numero = Number(valor);
    if (!numero || numero <= 0 || !data) {
      setErro("Preencha valor e data.");
      return;
    }
    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: salvo, error } = await supabase
      .from("retiradas_socio")
      .insert({
        valor: numero,
        data,
        observacao: observacao.trim() || null,
        criado_por: userData.user!.id,
      })
      .select("*, profiles!retiradas_socio_criado_por_fkey(nome)")
      .single();
    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setValor("");
    setObservacao("");
    toast.success("Retirada lançada.");
    onCriada(salvo as any);
  }

  return (
    <Card className="mt-4 border-border bg-ink-soft p-5">
      <p className="text-sm font-semibold text-foreground">Registrar retirada</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
        {salvando ? "Salvando..." : "Registrar retirada"}
      </Button>
    </Card>
  );
}

function LinhaRetirada({
  retirada,
  onAtualizada,
  onExcluida,
}: {
  retirada: Retirada;
  onAtualizada: (r: Retirada) => void;
  onExcluida: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(retirada.valor));
  const [data, setData] = useState(retirada.data);
  const [observacao, setObservacao] = useState(retirada.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const supabase = createClient();
  const confirmar = useConfirmacao();

  async function salvar() {
    const numero = Number(valor);
    if (!numero || numero <= 0 || !data) return;
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("retiradas_socio")
      .update({ valor: numero, data, observacao: observacao.trim() || null })
      .eq("id", retirada.id)
      .select("*, profiles!retiradas_socio_criado_por_fkey(nome)")
      .single();
    setSalvando(false);
    if (error || !salvo) {
      toast.error("Não foi possível salvar", { description: error?.message });
      return;
    }
    onAtualizada(salvo as any);
    setEditando(false);
    toast.success("Retirada atualizada.");
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir retirada de ${moeda(Number(retirada.valor))}?`,
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindo(true);
    const { error } = await supabase.from("retiradas_socio").delete().eq("id", retirada.id);
    setExcluindo(false);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    onExcluida(retirada.id);
    toast.success("Retirada excluída.");
  }

  if (editando) {
    return (
      <Card className="border-gold/40 bg-ink-soft p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="bg-background" />
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="bg-background" />
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
        <p className="font-semibold text-foreground">Retirada de salário</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(`${retirada.data}T12:00:00`).toLocaleDateString("pt-BR")}
          {retirada.observacao && ` · ${retirada.observacao}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-lg font-semibold text-foreground">{moeda(Number(retirada.valor))}</p>
        <button onClick={() => setEditando(true)} aria-label="Editar retirada" className="text-muted-foreground/70 hover:text-gold">
          <PencilIcon className="size-4" />
        </button>
        <button
          onClick={excluir}
          disabled={excluindo}
          aria-label="Excluir retirada"
          className="text-muted-foreground/70 hover:text-destructive disabled:opacity-50"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </Card>
  );
}

function NovoInvestimentoForm({ onCriado }: { onCriado: (i: Investimento) => void }) {
  const [nome, setNome] = useState("");
  const [custoEstimado, setCustoEstimado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = createClient();

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro("Dê um nome pra essa ideia de investimento.");
      return;
    }
    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: salvo, error } = await supabase
      .from("investimentos_prospeccao")
      .insert({
        nome: nome.trim(),
        custo_estimado: custoEstimado.trim() ? Number(custoEstimado) : null,
        observacoes: observacoes.trim() || null,
        criado_por: userData.user!.id,
      })
      .select("*, profiles!investimentos_prospeccao_criado_por_fkey(nome)")
      .single();
    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setNome("");
    setCustoEstimado("");
    setObservacoes("");
    toast.success("Investimento adicionado à lista.");
    onCriado(salvo as any);
  }

  return (
    <Card className="mt-4 border-border bg-ink-soft p-5">
      <p className="text-sm font-semibold text-foreground">Nova ideia de investimento</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Nome (ex: Reforma da sala 2)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="bg-background sm:col-span-2"
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Custo estimado (opcional)"
          value={custoEstimado}
          onChange={(e) => setCustoEstimado(e.target.value)}
          className="bg-background sm:col-span-2"
        />
        <Textarea
          placeholder="Observações / retorno esperado (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          className="bg-background sm:col-span-2"
        />
      </div>
      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
      <Button onClick={salvar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
        <PlusIcon className="size-3.5" data-icon="inline-start" />
        {salvando ? "Salvando..." : "Adicionar à lista"}
      </Button>
    </Card>
  );
}

function LinhaInvestimento({
  investimento,
  onAtualizado,
  onExcluido,
}: {
  investimento: Investimento;
  onAtualizado: (i: Investimento) => void;
  onExcluido: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(investimento.nome);
  const [custoEstimado, setCustoEstimado] = useState(
    investimento.custo_estimado != null ? String(investimento.custo_estimado) : ""
  );
  const [observacoes, setObservacoes] = useState(investimento.observacoes ?? "");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const supabase = createClient();
  const confirmar = useConfirmacao();

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("investimentos_prospeccao")
      .update({
        nome: nome.trim(),
        custo_estimado: custoEstimado.trim() ? Number(custoEstimado) : null,
        observacoes: observacoes.trim() || null,
      })
      .eq("id", investimento.id)
      .select("*, profiles!investimentos_prospeccao_criado_por_fkey(nome)")
      .single();
    setSalvando(false);
    if (error || !salvo) {
      toast.error("Não foi possível salvar", { description: error?.message });
      return;
    }
    onAtualizado(salvo as any);
    setEditando(false);
    toast.success("Investimento atualizado.");
  }

  async function mudarStatus(status: string) {
    const { data: salvo, error } = await supabase
      .from("investimentos_prospeccao")
      .update({ status })
      .eq("id", investimento.id)
      .select("*, profiles!investimentos_prospeccao_criado_por_fkey(nome)")
      .single();
    if (error || !salvo) {
      toast.error("Não foi possível atualizar o status", { description: error?.message });
      return;
    }
    onAtualizado(salvo as any);
    toast.success("Status atualizado.");
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir "${investimento.nome}"?`,
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindo(true);
    const { error } = await supabase.from("investimentos_prospeccao").delete().eq("id", investimento.id);
    setExcluindo(false);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    onExcluido(investimento.id);
    toast.success("Investimento excluído.");
  }

  if (editando) {
    return (
      <Card className="border-gold/40 bg-ink-soft p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background sm:col-span-2" />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Custo estimado"
            value={custoEstimado}
            onChange={(e) => setCustoEstimado(e.target.value)}
            className="bg-background sm:col-span-2"
          />
          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="bg-background sm:col-span-2" />
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
    <Card className="gap-2 border-border bg-ink-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
            {investimento.nome}
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-normal uppercase tracking-widest",
                STATUS_INVESTIMENTO_CLASS[investimento.status]
              )}
            >
              {STATUS_INVESTIMENTO_LABEL[investimento.status]}
            </span>
          </p>
          {investimento.custo_estimado != null && (
            <p className="mt-0.5 font-mono text-sm text-muted-foreground">
              Custo estimado: {moeda(Number(investimento.custo_estimado))}
            </p>
          )}
          {investimento.observacoes && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{investimento.observacoes}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">registrado por {investimento.profiles?.nome ?? "Equipe"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditando(true)} aria-label="Editar investimento" className="text-muted-foreground/70 hover:text-gold">
            <PencilIcon className="size-4" />
          </button>
          <button
            onClick={excluir}
            disabled={excluindo}
            aria-label="Excluir investimento"
            className="text-muted-foreground/70 hover:text-destructive disabled:opacity-50"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      </div>
      {investimento.status !== "descartado" && (
        <div className="flex flex-wrap gap-2">
          {investimento.status !== "aprovado" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => mudarStatus("aprovado")}
              className="border-success/40 text-success hover:bg-success/10"
            >
              <BadgeCheckIcon className="size-3.5" data-icon="inline-start" />
              Aprovar
            </Button>
          )}
          {investimento.status !== "em_analise" && (
            <Button size="sm" variant="outline" onClick={() => mudarStatus("em_analise")}>
              Voltar pra análise
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => mudarStatus("descartado")}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <BadgeXIcon className="size-3.5" data-icon="inline-start" />
            Descartar
          </Button>
        </div>
      )}
      {investimento.status === "descartado" && (
        <Button size="sm" variant="outline" onClick={() => mudarStatus("em_analise")} className="w-fit">
          Reconsiderar
        </Button>
      )}
    </Card>
  );
}
