"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, PackageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcularSlotsLivres } from "@/lib/disponibilidade";
import { somaDias } from "@/lib/timezone-sp";
import { FORMAS_PAGAMENTO } from "@/lib/constants";
import { pacoteUsavelNaData, valorPorVisita, type PacoteCliente } from "@/lib/pacotes-cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };
type ClienteEncontrado = { id: string; nome: string; telefone: string | null };

const OPCOES_REPETICAO = [
  { label: "1 semana", dias: 7 },
  { label: "2 semanas", dias: 14 },
  { label: "3 semanas", dias: 21 },
  { label: "1 mês", dias: 30 },
  { label: "45 dias", dias: 45 },
  { label: "2 meses", dias: 60 },
];

export default function NovoAgendamentoBarbeiro({ barbeiroId }: { barbeiroId: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoId, setServicoId] = useState<string>("");

  const [precoEditado, setPrecoEditado] = useState<string>("");

  const [modoCliente, setModoCliente] = useState<"cadastrado" | "avulso">("cadastrado");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<ClienteEncontrado[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteEncontrado | null>(null);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [telefoneAvulso, setTelefoneAvulso] = useState("");
  const [pacotesCliente, setPacotesCliente] = useState<PacoteCliente[]>([]);
  const [usarPacote, setUsarPacote] = useState(false);

  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horario, setHorario] = useState<string | null>(null);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);

  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro");
  const [repetir, setRepetir] = useState(false);
  const [frequenciaDias, setFrequenciaDias] = useState(30);
  const [repetirAte, setRepetirAte] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("servicos").select("id, nome, preco, duracao_minutos").eq("ativo", true).order("preco"),
      supabase.from("barbeiro_servicos").select("servico_id, ativo, preco_personalizado").eq("barbeiro_id", barbeiroId),
    ]).then(([{ data: servicosData }, { data: personalizados }]) => {
      const lista = servicosData ?? [];
      // Sem nenhuma personalização cadastrada, oferece todos os serviços
      // ativos pelo preço padrão (mesmo fallback do fluxo de agendamento
      // do cliente); com personalização, só os que o barbeiro ligou.
      if (!personalizados || personalizados.length === 0) {
        setServicos(lista);
        return;
      }
      const mapa = new Map(personalizados.map((p) => [p.servico_id, p]));
      setServicos(
        lista
          .filter((s) => mapa.get(s.id)?.ativo)
          .map((s) => ({ ...s, preco: mapa.get(s.id)?.preco_personalizado ?? s.preco }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHorario(null);
    setBuscandoHorarios(true);
    calcularSlotsLivres(supabase, barbeiroId, data).then((slots) => {
      setHorarios(slots);
      setBuscandoHorarios(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  useEffect(() => {
    if (buscaCliente.trim().length < 2) {
      setResultadosCliente([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, telefone")
        .eq("role", "cliente")
        .ilike("nome", `%${buscaCliente.trim()}%`)
        .limit(8);
      setResultadosCliente(data ?? []);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaCliente]);

  useEffect(() => {
    if (modoCliente !== "cadastrado" || !clienteSelecionado) {
      setPacotesCliente([]);
      return;
    }
    supabase
      .from("pacotes_cliente")
      .select("*")
      .eq("cliente_id", clienteSelecionado.id)
      .eq("ativo", true)
      .then(({ data }) => setPacotesCliente((data ?? []) as any));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSelecionado, modoCliente]);

  const pacoteUsavel =
    !repetir && pacotesCliente.find((p) => pacoteUsavelNaData(p, data)) ? pacotesCliente.find((p) => pacoteUsavelNaData(p, data))! : null;

  useEffect(() => {
    setUsarPacote(Boolean(pacoteUsavel));
    if (pacoteUsavel) setPrecoEditado(String(valorPorVisita(pacoteUsavel)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacoteUsavel?.id]);

  function limpar() {
    setServicoId("");
    setPrecoEditado("");
    setModoCliente("cadastrado");
    setBuscaCliente("");
    setResultadosCliente([]);
    setClienteSelecionado(null);
    setNomeAvulso("");
    setTelefoneAvulso("");
    setPacotesCliente([]);
    setUsarPacote(false);
    setHorario(null);
    setFormaPagamento("dinheiro");
    setRepetir(false);
    setFrequenciaDias(30);
    setRepetirAte("");
    setErro(null);
    setResultado(null);
  }

  async function criarAgendamento(servico: Servico, dataISO: string, valor: number, pacoteId: string | null) {
    const { data: agendamento, error } = await supabase
      .from("agendamentos")
      .insert({
        barbeiro_id: barbeiroId,
        servico_id: servico.id,
        cliente_id: modoCliente === "cadastrado" ? clienteSelecionado!.id : null,
        cliente_nome_avulso: modoCliente === "avulso" ? nomeAvulso.trim() : null,
        cliente_telefone_avulso: modoCliente === "avulso" ? telefoneAvulso.trim() || null : null,
        // -03:00 explícito: sem isso o Postgres guarda a string como se já
        // fosse UTC e o horário salvo fica 3h adiantado em relação ao escolhido.
        data_hora: `${dataISO}T${horario}:00-03:00`,
        status: "confirmado",
        forma_pagamento: pacoteId ? null : (formaPagamento as any),
        pagamento_antecipado: Boolean(pacoteId),
        valor_servico: valor,
        pacote_cliente_id: pacoteId,
      })
      .select()
      .single();

    if (!error && agendamento) {
      fetch(`/api/agendamentos/${agendamento.id}/criar-manual`, { method: "POST" }).catch(() => {});
    }
    return { agendamento, error };
  }

  async function confirmar() {
    setErro(null);
    const servico = servicos.find((s) => s.id === servicoId);
    if (!servico || !horario) {
      setErro("Escolha o serviço e o horário.");
      return;
    }
    if (modoCliente === "cadastrado" && !clienteSelecionado) {
      setErro("Busque e selecione um cliente, ou troque pra \"Cliente avulso\".");
      return;
    }
    if (modoCliente === "avulso" && !nomeAvulso.trim()) {
      setErro("Informe o nome do cliente.");
      return;
    }
    if (repetir && !repetirAte) {
      setErro("Escolha até quando repetir.");
      return;
    }

    const valor = precoEditado.trim() ? Number(precoEditado) : servico.preco;
    if (Number.isNaN(valor) || valor < 0) {
      setErro("Valor inválido.");
      return;
    }

    const pacoteId = usarPacote && pacoteUsavel ? pacoteUsavel.id : null;

    setEnviando(true);
    const { error } = await criarAgendamento(servico, data, valor, pacoteId);

    if (error) {
      setEnviando(false);
      setErro(
        error.message ||
          "Não foi possível reservar. Talvez esse horário já tenha sido ocupado - escolha outro."
      );
      return;
    }

    if (!repetir) {
      setEnviando(false);
      setOpen(false);
      limpar();
      router.refresh();
      return;
    }

    // Repete o mesmo horário a cada `frequenciaDias`, pulando datas em que
    // esse horário já não estiver mais livre (feriado, outro cliente etc.).
    let cursor = data;
    let criados = 1;
    let pulados = 0;
    while (true) {
      cursor = somaDias(cursor, frequenciaDias);
      if (cursor > repetirAte) break;
      const livres = await calcularSlotsLivres(supabase, barbeiroId, cursor);
      if (livres.includes(horario)) {
        const { error: erroRepeticao } = await criarAgendamento(servico, cursor, valor, null);
        if (erroRepeticao) pulados++;
        else criados++;
      } else {
        pulados++;
      }
    }

    setEnviando(false);
    setResultado(
      pulados > 0
        ? `Criados ${criados} agendamentos. ${pulados} data(s) pulada(s) porque esse horário já estava ocupado.`
        : `Criados ${criados} agendamentos.`
    );
    router.refresh();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="rounded-full border-gold/40 text-gold hover:bg-gold/10"
      >
        <PlusIcon data-icon="inline-start" />
        Novo agendamento
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) limpar();
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservar horário</DialogTitle>
            <DialogDescription>
              Pra atender um cliente que ligou ou chegou sem marcar - fica confirmado direto.
            </DialogDescription>
          </DialogHeader>

          {resultado ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-foreground">{resultado}</p>
              <Button
                onClick={() => {
                  setOpen(false);
                  limpar();
                }}
                className="w-full uppercase tracking-widest"
              >
                Fechar
              </Button>
            </div>
          ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Serviço</p>
              <div className="mt-2 grid gap-2">
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServicoId(s.id);
                      setPrecoEditado(String(s.preco));
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm",
                      servicoId === s.id
                        ? "border-gold bg-gold-gradient font-semibold text-ink"
                        : "border-border text-muted-foreground hover:border-gold"
                    )}
                  >
                    <span>{s.nome}</span>
                    <span className="font-mono">R$ {Number(s.preco).toFixed(2).replace(".", ",")}</span>
                  </button>
                ))}
              </div>
              {servicoId && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Valor</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={precoEditado}
                    disabled={usarPacote && Boolean(pacoteUsavel)}
                    onChange={(e) => setPrecoEditado(e.target.value)}
                    className="h-8 w-28 bg-background"
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Cliente</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setModoCliente("cadastrado");
                    setNomeAvulso("");
                    setTelefoneAvulso("");
                  }}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                    modoCliente === "cadastrado"
                      ? "border-gold bg-gold-gradient text-ink"
                      : "border-border text-muted-foreground hover:border-gold"
                  )}
                >
                  Cliente cadastrado
                </button>
                <button
                  onClick={() => {
                    setModoCliente("avulso");
                    setClienteSelecionado(null);
                    setBuscaCliente("");
                  }}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                    modoCliente === "avulso"
                      ? "border-gold bg-gold-gradient text-ink"
                      : "border-border text-muted-foreground hover:border-gold"
                  )}
                >
                  Cliente avulso
                </button>
              </div>

              {modoCliente === "cadastrado" ? (
                <div className="mt-2">
                  {clienteSelecionado ? (
                    <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
                      <span className="text-foreground">{clienteSelecionado.nome}</span>
                      <button
                        onClick={() => setClienteSelecionado(null)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Buscar por nome..."
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                        className="bg-background"
                      />
                      {resultadosCliente.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1 rounded-lg border border-border bg-ink-soft p-1.5">
                          {resultadosCliente.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setClienteSelecionado(c);
                                setBuscaCliente("");
                                setResultadosCliente([]);
                              }}
                              className="rounded-md px-2 py-1.5 text-left text-sm text-foreground/90 hover:bg-gold/10"
                            >
                              {c.nome}
                              {c.telefone && (
                                <span className="ml-2 text-xs text-muted-foreground">{c.telefone}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <Input
                    placeholder="Nome do cliente"
                    value={nomeAvulso}
                    onChange={(e) => setNomeAvulso(e.target.value)}
                    className="bg-background"
                  />
                  <Input
                    placeholder="Telefone (opcional)"
                    value={telefoneAvulso}
                    onChange={(e) => setTelefoneAvulso(e.target.value)}
                    className="bg-background"
                  />
                </div>
              )}
            </div>

            {pacoteUsavel && (
              <label className="flex items-start justify-between gap-3 rounded-lg border border-gold/50 bg-gold/10 px-3 py-2.5">
                <span className="flex items-start gap-2">
                  <PackageIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      Usar pacote: {pacoteUsavel.nome}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {pacoteUsavel.visitas_usadas} de {pacoteUsavel.qtd_visitas_incluidas} usadas · R${" "}
                      {valorPorVisita(pacoteUsavel).toFixed(2).replace(".", ",")}/visita
                    </span>
                  </span>
                </span>
                <Switch
                  checked={usarPacote}
                  onCheckedChange={(v) => {
                    setUsarPacote(v);
                    const servico = servicos.find((s) => s.id === servicoId);
                    if (v) setPrecoEditado(String(valorPorVisita(pacoteUsavel)));
                    else if (servico) setPrecoEditado(String(servico.preco));
                  }}
                />
              </label>
            )}
            {repetir && pacotesCliente.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Repetição não usa pacote automaticamente — cada data extra é cobrada pelo valor normal.
              </p>
            )}

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Data</p>
              <Input
                type="date"
                value={data}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setData(e.target.value)}
                className="mt-2 bg-background"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Horário</p>
              {buscandoHorarios ? (
                <p className="mt-2 text-sm text-muted-foreground">Verificando disponibilidade...</p>
              ) : (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {horarios.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorario(h)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm",
                        horario === h
                          ? "border-gold bg-gold-gradient font-bold text-ink"
                          : "border-border text-muted-foreground hover:border-gold"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                  {horarios.length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground">
                      Nenhum horário livre nesse dia.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm font-medium text-foreground">Repetir esse agendamento</span>
                <Switch checked={repetir} onCheckedChange={setRepetir} />
              </label>
              {repetir && (
                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">De quanto em quanto tempo</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {OPCOES_REPETICAO.map((op) => (
                        <button
                          key={op.dias}
                          onClick={() => setFrequenciaDias(op.dias)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-xs font-semibold",
                            frequenciaDias === op.dias
                              ? "border-gold bg-gold-gradient text-ink"
                              : "border-border text-muted-foreground hover:border-gold"
                          )}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Repetir até</p>
                    <Input
                      type="date"
                      value={repetirAte}
                      min={data}
                      onChange={(e) => setRepetirAte(e.target.value)}
                      className="mt-2 bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            {!(usarPacote && pacoteUsavel) && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Forma de pagamento</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FORMAS_PAGAMENTO.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormaPagamento(f.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        formaPagamento === f.id
                          ? "border-gold bg-gold-gradient font-bold text-ink"
                          : "border-border text-muted-foreground hover:border-gold"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <Button onClick={confirmar} disabled={enviando} className="w-full uppercase tracking-widest">
              {enviando ? "Reservando..." : repetir ? "Reservar e repetir" : "Reservar horário"}
            </Button>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
