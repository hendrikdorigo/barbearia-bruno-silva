import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendamentoClienteAcoes from "@/components/AgendamentoClienteAcoes";
import PreferenciaNotificacao from "@/components/PreferenciaNotificacao";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "Cancelado por atraso",
  concluido: "Concluído",
};

const STATUS_COLOR: Record<string, string> = {
  pendente: "text-yellow-400",
  confirmado: "text-green-400",
  cancelado: "text-neutral-500",
  no_show: "text-red-400",
  concluido: "text-gold",
};

export default async function PainelClientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("*, barbeiros(profile_id, profiles(nome)), servicos(nome, preco)")
    .eq("cliente_id", user.id)
    .order("data_hora", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("notif_whatsapp_comunidade")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-neutral-50">
        Meus agendamentos
      </h1>

      <PreferenciaNotificacao
        profileId={user.id}
        ativoInicial={profile?.notif_whatsapp_comunidade ?? false}
      />

      {cliente?.exige_pagamento_antecipado && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          Sua próxima marcação exigirá pagamento antecipado devido a um
          cancelamento por atraso.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {agendamentos?.length ? (
          agendamentos.map((a: any) => (
            <div key={a.id} className="rounded-xl border border-ink-line bg-ink-soft p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-neutral-100">
                  {a.servicos?.nome} com {a.barbeiros?.profiles?.nome}
                </p>
                <span className={`text-xs font-bold uppercase ${STATUS_COLOR[a.status]}`}>
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                {new Date(a.data_hora).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")} ·{" "}
                {a.pagamento_antecipado ? "Pago antecipado" : "Pagamento no local"}
              </p>
              <AgendamentoClienteAcoes agendamento={a} />
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-500">Você ainda não tem agendamentos.</p>
        )}
      </div>
    </div>
  );
}
