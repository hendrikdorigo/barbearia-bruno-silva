import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { criarPagamentoPix, mercadoPagoConfigurado } from "@/lib/mercadopago";

/**
 * Gera um pagamento Pix (com QR Code) no Mercado Pago para um agendamento já
 * criado (status "pendente"). Chamada pelo cliente ao escolher "Pagar agora"
 * em /agendar/[barbeiroId].
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
    .select("id, valor_servico, servicos(nome)")
    .eq("id", agendamentoId)
    .eq("cliente_id", user.id)
    .maybeSingle();

  if (!agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { error: pagamentoError } = await supabase.from("pagamentos").insert({
    agendamento_id: agendamento.id,
    metodo: "pix",
    status: "pendente",
    valor: agendamento.valor_servico,
  });
  if (pagamentoError) {
    return NextResponse.json({ error: pagamentoError.message }, { status: 400 });
  }

  try {
    const pix = await criarPagamentoPix({
      externalReference: `agendamento:${agendamento.id}`,
      descricao: `${(agendamento as any).servicos?.nome ?? "Atendimento"} - Barbearia Bruno Silva`,
      valor: Number(agendamento.valor_servico),
      emailComprador: user.email!,
      baseUrl: request.nextUrl.origin,
    });
    return NextResponse.json({
      paymentId: pix.paymentId,
      qrCodeBase64: pix.qrCodeBase64,
      qrCode: pix.qrCode,
    });
  } catch (e) {
    console.error("Erro ao criar pagamento Pix (Mercado Pago):", e);
    return NextResponse.json(
      { error: "Não foi possível gerar o Pix. Tente novamente." },
      { status: 502 }
    );
  }
}
