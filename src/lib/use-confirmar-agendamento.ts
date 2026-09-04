import { useState } from "react";
import type { createClient } from "@/lib/supabase/client";
import type { FormaPagamento, Servico } from "@/lib/constants";
import type { PacoteCliente } from "@/lib/pacotes-cliente";
import { salvarProdutosNaComanda, type Carrinho, type Produto } from "@/lib/produtos-carrinho";

/**
 * Cria o agendamento e salva os produtos escolhidos na comanda. Mesma lógica
 * nas duas telas de agendamento - só o jeito de achar o barbeiro_id muda
 * (uma tem barbeiro pré-selecionado pela URL, a outra escolhe entre
 * candidatos), por isso ele entra como parâmetro em vez de vir do estado.
 */
export function useConfirmarAgendamento({
  supabase,
  barbeiroId,
  data,
  horarioSelecionado,
  servicoSelecionado,
  usarPacote,
  pacoteUsavel,
  formaPagamento,
  precoFinalComPagamento,
  carrinho,
  produtos,
  onSucesso,
}: {
  supabase: ReturnType<typeof createClient>;
  barbeiroId: string | null;
  data: string;
  horarioSelecionado: string | null;
  servicoSelecionado: Servico | null;
  usarPacote: boolean;
  pacoteUsavel: PacoteCliente | null;
  formaPagamento: FormaPagamento;
  precoFinalComPagamento: number;
  carrinho: Carrinho;
  produtos: Produto[];
  onSucesso: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [avisoProdutos, setAvisoProdutos] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [perguntarFrequencia, setPerguntarFrequencia] = useState(false);

  async function confirmarAgendamento() {
    setErro(null);
    setAvisoProdutos(null);
    setEnviando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !servicoSelecionado || !horarioSelecionado || !barbeiroId) {
      setErro("Dados incompletos.");
      setEnviando(false);
      return;
    }

    // -03:00 explícito: Brasília não tem horário de verão desde 2019, então
    // é sempre UTC-3. Sem isso, o Postgres guarda a string como se já fosse
    // UTC e o horário salvo fica 3h adiantado em relação ao escolhido.
    const dataHoraISO = `${data}T${horarioSelecionado}:00-03:00`;

    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: user.id,
        barbeiro_id: barbeiroId,
        servico_id: servicoSelecionado.id,
        data_hora: dataHoraISO,
        status: "confirmado",
        forma_pagamento: usarPacote && pacoteUsavel ? null : formaPagamento,
        pagamento_antecipado: Boolean(usarPacote && pacoteUsavel),
        valor_servico: precoFinalComPagamento,
        pacote_cliente_id: usarPacote && pacoteUsavel ? pacoteUsavel.id : null,
      })
      .select()
      .single();

    if (agendamentoError || !agendamento) {
      setErro(
        agendamentoError?.message ??
          "Não foi possível criar o agendamento. Talvez esse horário já tenha sido reservado - volte e escolha outro."
      );
      setEnviando(false);
      return;
    }

    // Coloca o evento no Google Calendar do barbeiro assim que o horário é
    // reservado, sem esperar ele confirmar. Não bloqueia a tela de sucesso.
    fetch(`/api/agendamentos/${agendamento.id}/criar`, { method: "POST" }).catch(() => {});

    const { data: clienteFrequencia } = await supabase
      .from("clientes")
      .select("frequencia_dias")
      .eq("profile_id", user.id)
      .maybeSingle();
    setPerguntarFrequencia(clienteFrequencia?.frequencia_dias == null);

    const { erro: erroProdutos } = await salvarProdutosNaComanda(supabase, agendamento.id, carrinho, produtos);
    if (erroProdutos) setAvisoProdutos(erroProdutos);

    setEnviando(false);
    onSucesso();
  }

  return { confirmarAgendamento, erro, avisoProdutos, enviando, perguntarFrequencia };
}
