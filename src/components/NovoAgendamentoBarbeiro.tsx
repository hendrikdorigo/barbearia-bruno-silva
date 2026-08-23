"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcularSlotsLivres } from "@/lib/disponibilidade";
import { FORMAS_PAGAMENTO } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };
type ClienteEncontrado = { id: string; nome: string; telefone: string | null };

export default function NovoAgendamentoBarbeiro({ barbeiroId }: { barbeiroId: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoId, setServicoId] = useState<string>("");

  const [modoCliente, setModoCliente] = useState<"cadastrado" | "avulso">("cadastrado");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<ClienteEncontrado[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteEncontrado | null>(null);
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [telefoneAvulso, setTelefoneAvulso] = useState("");

  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horario, setHorario] = useState<string | null>(null);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);

  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  function limpar() {
    setServicoId("");
    setModoCliente("cadastrado");
    setBuscaCliente("");
    setResultadosCliente([]);
    setClienteSelecionado(null);
    setNomeAvulso("");
    setTelefoneAvulso("");
    setHorario(null);
    setFormaPagamento("dinheiro");
    setErro(null);
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

    setEnviando(true);
    const { data: agendamento, error } = await supabase
      .from("agendamentos")
      .insert({
        barbeiro_id: barbeiroId,
        servico_id: servico.id,
        cliente_id: modoCliente === "cadastrado" ? clienteSelecionado!.id : null,
        cliente_nome_avulso: modoCliente === "avulso" ? nomeAvulso.trim() : null,
        cliente_telefone_avulso: modoCliente === "avulso" ? telefoneAvulso.trim() || null : null,
        data_hora: `${data}T${horario}:00`,
        status: "confirmado",
        forma_pagamento: formaPagamento as any,
        pagamento_antecipado: false,
        valor_servico: servico.preco,
      })
      .select()
      .single();

    setEnviando(false);
    if (error || !agendamento) {
      setErro(
        error?.message ??
          "Não foi possível reservar. Talvez esse horário já tenha sido ocupado - escolha outro."
      );
      return;
    }

    fetch(`/api/agendamentos/${agendamento.id}/criar-manual`, { method: "POST" }).catch(() => {});

    setOpen(false);
    limpar();
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reservar horário</DialogTitle>
            <DialogDescription>
              Pra atender um cliente que ligou ou chegou sem marcar - fica confirmado direto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Serviço</p>
              <div className="mt-2 grid gap-2">
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServicoId(s.id)}
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

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <Button onClick={confirmar} disabled={enviando} className="w-full uppercase tracking-widest">
              {enviando ? "Reservando..." : "Reservar horário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
