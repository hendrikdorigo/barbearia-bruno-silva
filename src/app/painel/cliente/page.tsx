import { CalendarIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendamentoClienteAcoes from "@/components/AgendamentoClienteAcoes";
import PreferenciaNotificacao from "@/components/PreferenciaNotificacao";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "Cancelado por atraso",
  concluido: "Concluído",
};

const STATUS_CLASS: Record<string, string> = {
  pendente: "border-transparent bg-amber-500/15 text-amber-400",
  confirmado: "border-transparent bg-success/15 text-success",
  cancelado: "border-transparent bg-muted text-muted-foreground",
  no_show: "border-transparent bg-destructive/15 text-destructive",
  concluido: "border-transparent bg-gold/15 text-gold",
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
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Meus agendamentos
      </h1>

      <PreferenciaNotificacao
        profileId={user.id}
        ativoInicial={profile?.notif_whatsapp_comunidade ?? false}
      />

      {cliente?.exige_pagamento_antecipado && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            Sua próxima marcação exigirá pagamento antecipado devido a um
            cancelamento por atraso.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 space-y-4">
        {agendamentos?.length ? (
          agendamentos.map((a: any) => (
            <Card key={a.id} className="gap-0 border-border bg-ink-soft p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">
                  {a.servicos?.nome} com {a.barbeiros?.profiles?.nome}
                </p>
                <Badge className={cn("uppercase", STATUS_CLASS[a.status])}>
                  {STATUS_LABEL[a.status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(a.data_hora).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")} ·{" "}
                {a.pagamento_antecipado ? "Pago antecipado" : "Pagamento no local"}
              </p>
              <AgendamentoClienteAcoes agendamento={a} />
            </Card>
          ))
        ) : (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarIcon />
              </EmptyMedia>
              <EmptyTitle>Você ainda não tem agendamentos</EmptyTitle>
              <EmptyDescription>Escolha um barbeiro e marque seu horário.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
