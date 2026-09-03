import { CalendarIcon, PackageIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendamentoClienteAcoes from "@/components/AgendamentoClienteAcoes";
import PreferenciaNotificacao from "@/components/PreferenciaNotificacao";
import AvatarUploader from "@/components/AvatarUploader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { pacoteVigente, textoDiasSemana, pacoteTemRateio, valorPorVisita } from "@/lib/pacotes-cliente";
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

  const [{ data: cliente }, { data: agendamentos }, { data: profile }, { data: pacotes }] = await Promise.all([
    supabase.from("clientes").select("*").eq("profile_id", user.id).maybeSingle(),
    supabase
      .from("agendamentos")
      .select("*, barbeiros(profile_id, profiles(nome)), servicos(nome, preco)")
      .eq("cliente_id", user.id)
      .order("data_hora", { ascending: false }),
    supabase.from("profiles").select("nome, avatar_url, notif_whatsapp_comunidade").eq("id", user.id).single(),
    supabase
      .from("pacotes_cliente")
      .select("*")
      .eq("cliente_id", user.id)
      .eq("ativo", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Meus agendamentos
      </h1>

      {profile && (
        <div className="mt-6">
          <AvatarUploader
            userId={user.id}
            avatarUrl={profile.avatar_url}
            nome={profile.nome}
            syncClienteFoto
          />
        </div>
      )}

      <PreferenciaNotificacao
        profileId={user.id}
        ativoInicial={profile?.notif_whatsapp_comunidade ?? false}
      />

      {pacotes && pacotes.length > 0 && (
        <div className="mt-8 space-y-3">
          {pacotes.map((p: any) => (
            <Card key={p.id} className="gap-0 border-gold/40 bg-gold/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-display text-xl text-foreground">
                  <PackageIcon className="size-5 text-gold" />
                  {p.nome}
                </p>
                <Badge variant="outline" className={pacoteVigente(p) ? "text-success" : "text-muted-foreground"}>
                  {pacoteVigente(p) ? "Vigente" : "Fora da validade"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Válido: {textoDiasSemana(p.dias_semana)}
                {(p.data_inicio || p.data_fim) && (
                  <>
                    {" · "}
                    {p.data_inicio ? new Date(`${p.data_inicio}T00:00:00`).toLocaleDateString("pt-BR") : "sem início"}
                    {" até "}
                    {p.data_fim ? new Date(`${p.data_fim}T00:00:00`).toLocaleDateString("pt-BR") : "sem fim"}
                  </>
                )}
              </p>
              {pacoteTemRateio(p) && (
                <p className="mt-1.5 font-mono text-xs text-gold">
                  {p.visitas_usadas} de {p.qtd_visitas_incluidas} visitas usadas · R${" "}
                  {valorPorVisita(p).toFixed(2).replace(".", ",")}/visita
                </p>
              )}
              {p.observacoes && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{p.observacoes}</p>
              )}
            </Card>
          ))}
        </div>
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
