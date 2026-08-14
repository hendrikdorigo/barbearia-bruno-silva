import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FidelidadeEditor from "@/components/FidelidadeEditor";

export default async function FidelidadeBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("profile_id")
    .eq("profile_id", user.id)
    .single();
  if (!barbeiro) redirect("/");

  const { data: configs } = await supabase
    .from("fidelidade_config")
    .select("*")
    .eq("barbeiro_id", user.id)
    .order("meta_atendimentos");

  const { data: progresso } = await supabase
    .from("fidelidade_progresso")
    .select("*, clientes(profile_id, profiles(nome))")
    .eq("barbeiro_id", user.id)
    .order("atendimentos_concluidos", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Programa de fidelidade
      </h1>
      <p className="mt-2 text-muted-foreground">
        Crie conquistas automáticas: a cada X atendimentos concluídos, o
        cliente recebe uma notificação de brinde. Você decide o prêmio.
      </p>
      <FidelidadeEditor barbeiroId={user.id} configsIniciais={configs ?? []} />

      <h2 className="mt-14 font-display text-3xl tracking-wide text-foreground">
        Progresso dos clientes
      </h2>
      <div className="mt-4 space-y-2">
        {progresso?.length ? (
          progresso.map((p: any) => (
            <div
              key={`${p.barbeiro_id}-${p.cliente_id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-ink-soft px-4 py-3"
            >
              <p className="text-sm font-semibold text-foreground">
                {p.clientes?.profiles?.nome ?? "Cliente"}
              </p>
              <p className="text-sm text-gold">
                {p.atendimentos_concluidos} atendimentos
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda não há histórico de atendimentos concluídos.
          </p>
        )}
      </div>
    </div>
  );
}
