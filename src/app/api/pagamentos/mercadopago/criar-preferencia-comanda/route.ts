import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { criarPreferenciaPagamento, mercadoPagoConfigurado } from "@/lib/mercadopago";

const FORMAS_VALIDAS = ["credito", "debito", "pix"];

/**
 * Cria uma preferencia de pagamento para a comanda (servico + produtos
 * adicionados). O total é sempre recalculado aqui a partir do banco, nunca
 * confiado no valor que o navegador enviaria.
 */
export async function POST(request: NextRequest) {
  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      { error: "Pagamento online ainda não está configurado. Pague no caixa com o barbeiro." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const comandaId = body?.comandaId;
  const formaPagamento = FORMAS_VALIDAS.includes(body?.formaPagamento) ? body.formaPagamento : "pix";
  if (!comandaId) {
    return NextResponse.json({ error: "Comanda inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: comanda } = await supabase
    .from("comandas")
    .select("id, agendamento_id, valor_servico, status, comanda_itens(quantidade, preco_unitario)")
    .eq("id", comandaId)
    .eq("cliente_id", user.id)
    .maybeSingle();

  if (!comanda) {
    return NextResponse.json({ error: "Comanda não encontrada." }, { status: 404 });
  }
  if (comanda.status !== "aberta" && comanda.status !== "aguardando_pagamento") {
    return NextResponse.json({ error: "Esta comanda já foi paga ou fechada." }, { status: 400 });
  }

  const totalProdutos = ((comanda as any).comanda_itens ?? []).reduce(
    (soma: number, item: any) => soma + item.quantidade * Number(item.preco_unitario),
    0
  );
  const total = Number(comanda.valor_servico) + totalProdutos;

  const { error: pagamentoError } = await supabase.from("pagamentos").insert({
    agendamento_id: comanda.agendamento_id,
    metodo: formaPagamento,
    status: "pendente",
    valor: total,
  });
  if (pagamentoError) {
    return NextResponse.json({ error: pagamentoError.message }, { status: 400 });
  }

  try {
    const preferencia = await criarPreferenciaPagamento({
      externalReference: `comanda:${comanda.id}`,
      titulo: "Atendimento - Barbearia Bruno Silva",
      valor: total,
      emailComprador: user.email ?? undefined,
      baseUrl: request.nextUrl.origin,
      backUrlPath: `/pagamento/retorno-comanda?comanda=${comanda.id}`,
    });
    return NextResponse.json({ initPoint: preferencia.init_point });
  } catch (e) {
    console.error("Erro ao criar preferencia Mercado Pago (comanda):", e);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente." },
      { status: 502 }
    );
  }
}
