import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { enviarMensagemWhatsapp } from "@/lib/whatsapp";
import { paraDataSP, paraHoraSP, somaDias } from "@/lib/timezone-sp";

/**
 * Job diário de pré-agendamento.
 * -----------------------------------------------------------------------
 * Para cada cliente com `pre_agendamento_ativo`, olha o último agendamento
 * confirmado/concluído dele e soma `frequencia_dias`. Se essa data cair em
 * hoje, manda WhatsApp com um link (`pre_agendamentos.token`) pra ele
 * confirmar ou recusar o próximo horário, no mesmo horário de sempre.
 *
 * Como agendar (mesmo padrão dos outros crons - vercel.json → "crons"):
 * GET/POST com "authorization: Bearer <CRON_SECRET>".
 */
function autorizado(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const legacy = request.headers.get("x-cron-secret");
  return legacy === process.env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  return handlePreAgendamentos(request);
}

export async function POST(request: NextRequest) {
  return handlePreAgendamentos(request);
}

async function handlePreAgendamentos(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const hoje = paraDataSP(new Date().toISOString());
  const baseUrl = request.nextUrl.origin;

  const { data: clientesAtivos } = await supabase
    .from("clientes")
    .select("profile_id, frequencia_dias, profiles(nome, telefone)")
    .eq("pre_agendamento_ativo", true)
    .not("frequencia_dias", "is", null);

  let notificados = 0;
  let ignorados = 0;

  for (const cliente of (clientesAtivos as any[]) ?? []) {
    const { data: ultimaVisita } = await supabase
      .from("agendamentos")
      .select("id, data_hora, barbeiro_id, servico_id, barbeiros(profiles(nome)), servicos(nome)")
      .eq("cliente_id", cliente.profile_id)
      .in("status", ["confirmado", "concluido"])
      .order("data_hora", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ultimaVisita) {
      ignorados++;
      continue;
    }

    const novaData = somaDias(paraDataSP(ultimaVisita.data_hora), cliente.frequencia_dias);
    if (novaData !== hoje) {
      ignorados++;
      continue;
    }

    const { count: jaNotificado } = await supabase
      .from("pre_agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("origem_agendamento_id", ultimaVisita.id);
    if ((jaNotificado ?? 0) > 0) {
      ignorados++;
      continue;
    }

    const { count: jaTemHorarioHoje } = await supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", cliente.profile_id)
      .in("status", ["pendente", "confirmado"])
      .gte("data_hora", `${novaData}T00:00:00-03:00`)
      .lte("data_hora", `${novaData}T23:59:59-03:00`);
    if ((jaTemHorarioHoje ?? 0) > 0) {
      ignorados++;
      continue;
    }

    // -03:00 explícito: sem isso o Postgres guarda a string como se já fosse
    // UTC e o horário previsto fica 3h adiantado em relação ao real.
    const horaPrevista = paraHoraSP(ultimaVisita.data_hora);
    const dataHoraPrevista = `${novaData}T${horaPrevista}:00-03:00`;

    const nomeCliente = (cliente as any).profiles?.nome ?? "Tudo bem?";
    const nomeBarbeiro = (ultimaVisita as any).barbeiros?.profiles?.nome ?? "seu barbeiro";
    const nomeServico = (ultimaVisita as any).servicos?.nome ?? "seu atendimento";
    const telefone = (cliente as any).profiles?.telefone ?? null;

    // Gera o token aqui (em vez de deixar o banco gerar no insert) pra só
    // criar a linha DEPOIS de confirmar que a mensagem saiu - se o WhatsApp
    // ainda não estiver configurado (ou falhar), nada é gravado e o cron
    // tenta de novo no próximo dia, em vez de "gastar" essa tentativa.
    const token = randomBytes(16).toString("hex");
    const link = `${baseUrl}/pre-agendamento/${token}`;
    const mensagem =
      `Oi, ${nomeCliente}! Já faz um tempo desde seu último ${nomeServico} com ${nomeBarbeiro} ` +
      `na Barbearia Bruno Silva. Quer deixar marcado pra hoje, ${horaPrevista}? ` +
      `Confirme ou recuse aqui: ${link}`;

    const resultado = await enviarMensagemWhatsapp(telefone, mensagem);
    if (!resultado.sucesso) {
      ignorados++;
      continue;
    }

    const { error } = await supabase.from("pre_agendamentos").insert({
      cliente_id: cliente.profile_id,
      barbeiro_id: ultimaVisita.barbeiro_id,
      servico_id: ultimaVisita.servico_id,
      origem_agendamento_id: ultimaVisita.id,
      data_hora_prevista: dataHoraPrevista,
      token,
    });

    if (error) {
      ignorados++;
      continue;
    }

    notificados++;
  }

  return NextResponse.json({ notificados, ignorados });
}
