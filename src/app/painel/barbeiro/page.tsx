import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AgendaBarbeiro from "@/components/AgendaBarbeiro";
import ConectarGoogleCalendar from "@/components/ConectarGoogleCalendar";

export default async function PainelBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nome")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "barbeiro" && profile.role !== "admin")) {
    redirect("/");
  }

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("*, clientes(profile_id, profiles(nome, telefone)), servicos(nome, preco)")
    .eq("barbeiro_id", user.id)
    .order("data_hora", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide text-foreground">
          Olá, {profile.nome.split(" ")[0]}
        </h1>
        <div className="flex gap-3">
          <Link
            href="/painel/barbeiro/portfolio"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Editar portfólio
          </Link>
          <Link
            href="/painel/barbeiro/horarios"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Meus horários
          </Link>
          <Link
            href="/painel/barbeiro/servicos"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Meus serviços
          </Link>
          <Link
            href="/painel/barbeiro/fidelidade"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Fidelidade
          </Link>
          <Link
            href="/painel/barbeiro/comunidade"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Comunidade
          </Link>
        </div>
      </div>

      <ConectarGoogleCalendar conectado={barbeiro?.google_calendar_connected ?? false} />

      <h2 className="mt-10 font-display text-3xl text-foreground">Minha agenda</h2>
      <AgendaBarbeiro agendamentos={agendamentos ?? []} />
    </div>
  );
}
