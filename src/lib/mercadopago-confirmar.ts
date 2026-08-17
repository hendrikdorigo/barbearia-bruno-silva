import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { consultarPagamento } from "@/lib/mercadopago";

/**
 * Confirma (ou atualiza) um pagamento Pix a partir do id do pagamento no
 * Mercado Pago. Sempre re-consulta o pagamento pela API (nunca confia em
 * dados vindos só do cliente ou da URL) - usada tanto pelo webhook quanto
 * pela rota de polling que a página do QR Code chama enquanto aguarda.
 */
const STATUS_MAP: Record<string, "aprovado" | "recusado" | "estornado" | "pendente"> = {
  approved: "aprovado",
  rejected: "recusado",
  cancelled: "recusado",
  refunded: "estornado",
  charged_back: "estornado",
  pending: "pendente",
  in_process: "pendente",
};

export async function confirmarPagamentoPorId(paymentId: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  const pagamento = await consultarPagamento(paymentId);
  const [refTipo, refId] = (pagamento.external_reference ?? "").split(":");
  if (!refTipo || !refId) return null;

  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const statusPagamento = STATUS_MAP[pagamento.status] ?? "pendente";

  if (refTipo === "agendamento") {
    await admin
      .from("pagamentos")
      .update({ status: statusPagamento, gateway_referencia: String(pagamento.id) })
      .eq("agendamento_id", refId)
      .eq("status", "pendente");

    if (pagamento.status === "approved") {
      await admin
        .from("agendamentos")
        .update({ status: "confirmado", pagamento_antecipado: true })
        .eq("id", refId);
    }
  } else if (refTipo === "comanda") {
    const { data: comanda } = await admin
      .from("comandas")
      .select("agendamento_id")
      .eq("id", refId)
      .maybeSingle();

    if (comanda) {
      const { data: pagamentoAtualizado } = await admin
        .from("pagamentos")
        .update({ status: statusPagamento, gateway_referencia: String(pagamento.id) })
        .eq("agendamento_id", comanda.agendamento_id)
        .eq("status", "pendente")
        .select("metodo")
        .maybeSingle();

      if (pagamento.status === "approved") {
        await admin
          .from("comandas")
          .update({
            status: "paga",
            pago_antecipado: true,
            ...(pagamentoAtualizado ? { forma_pagamento: pagamentoAtualizado.metodo } : {}),
          })
          .eq("id", refId);
      }
    }
  }

  return pagamento.status;
}
