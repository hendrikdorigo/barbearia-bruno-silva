import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { criarPreferenciaPagamento, mercadoPagoConfigurado } from "@/lib/mercadopago";

/**
 * Cria uma preferencia de pagamento no Mercado Pago para um agendamento já
 * criado (status "pendente") e devolve a URL do checkout hospedado. Chamada
 * pelo cliente ao escolher "Pagar agora" em /agendar/[barbeiroId].
 */
export async function POST(request: NextRequest) {
  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Pagamento online ainda não está configurado. Escolha pagar no local." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const agendamentoId = body?.agendamentoId;
  if (!agendamentoId) {
    return NextResponse.json({ error: "Agendamento inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("id, valor_servico, forma_pagamento, servicos(nome)")
    .eq("id", agendamentoId)
    .eq("cliente_id", user.id)
    .maybeSingle();

  if (!agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { error: pagamentoError } = await supabase.from("pagamentos").insert({
    agendamento_id: agendamento.id,
    metodo: (agendamento as any).forma_pagamento,
    status: "pendente",
    valor: agendamento.valor_servico,
  });
  if (pagamentoError) {
    return NextResponse.json({ error: pagamentoError.message }, { status: 400 });
  }

  try {
    const preferencia = await criarPreferenciaPagamento({
      externalReference: `agendamento:${agendamento.id}`,
      titulo: `${(agendamento as any).servicos?.nome ?? "Atendimento"} - Barbearia Bruno Silva`,
      valor: Number(agendamento.valor_servico),
      emailComprador: user.email ?? undefined,
      baseUrl: request.nextUrl.origin,
      backUrlPath: `/pagamento/retorno?agendamento=${agendamento.id}`,
    });
    return NextResponse.json({ initPoint: preferencia.init_point });
  } catch (e) {
    console.error("Erro ao criar preferencia Mercado Pago:", e);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente." },
      { status: 502 }
    );
  }
}
