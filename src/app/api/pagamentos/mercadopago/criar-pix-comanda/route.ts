import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { criarPagamentoPix, mercadoPagoConfigurado } from "@/lib/mercadopago";

/**
 * Gera um pagamento Pix (com QR Code) para a comanda (serviço + produtos
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

  const [{ data: comanda }, { data: cliente }] = await Promise.all([
    supabase
      .from("comandas")
      .select("id, agendamento_id, valor_servico, status, comanda_itens(quantidade, preco_unitario)")
      .eq("id", comandaId)
      .eq("cliente_id", user.id)
      .maybeSingle(),
    supabase.from("clientes").select("email").eq("profile_id", user.id).maybeSingle(),
  ]);

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
    metodo: "pix",
    status: "pendente",
    valor: total,
  });
  if (pagamentoError) {
    return NextResponse.json({ error: pagamentoError.message }, { status: 400 });
  }

  try {
    const pix = await criarPagamentoPix({
      externalReference: `comanda:${comanda.id}`,
      descricao: "Atendimento - Barbearia Bruno Silva",
      valor: total,
      emailComprador: cliente?.email || user.email!,
      baseUrl: request.nextUrl.origin,
    });
    return NextResponse.json({
      paymentId: pix.paymentId,
      qrCodeBase64: pix.qrCodeBase64,
      qrCode: pix.qrCode,
    });
  } catch (e) {
    console.error("Erro ao criar pagamento Pix (comanda):", e);
    return NextResponse.json(
      { error: "Não foi possível gerar o Pix. Tente novamente." },
      { status: 502 }
    );
  }
}
