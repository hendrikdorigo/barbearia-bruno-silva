import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PainelAdminAgendamentos from "@/components/PainelAdminAgendamentos";

export default async function PainelAdminPage() {
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

  if (profile?.role !== "admin") redirect("/");

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      "*, clientes(profile_id, profiles(nome)), barbeiros(profile_id, is_dono, profiles(nome)), servicos(nome)"
    )
    .order("data_hora", { ascending: false });

  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("profile_id, profiles(nome)")
    .eq("ativo", true);

  const { data: souBarbeiro } = await supabase
    .from("barbeiros")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl tracking-wide text-foreground">
          Painel do Bruno
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/painel/admin/barbeiros"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Gerenciar barbeiros
          </Link>
          <Link
            href="/painel/admin/repasses"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Repasses
          </Link>
          <Link
            href="/painel/admin/loja"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Loja
          </Link>
          <Link
            href="/painel/admin/popups"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
          >
            Pop-ups
          </Link>
        </div>
      </div>

      {souBarbeiro && (
        <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">
            Você também atende como barbeiro
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/painel/barbeiro"
              className="rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink"
            >
              Minha agenda
            </Link>
            <Link
              href="/painel/barbeiro/portfolio"
              className="rounded-full border border-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Editar meu portfólio
            </Link>
            <Link
              href="/painel/barbeiro/horarios"
              className="rounded-full border border-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Meus horários
            </Link>
            <Link
              href="/painel/barbeiro/servicos"
              className="rounded-full border border-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Meus serviços
            </Link>
            <Link
              href="/painel/barbeiro/fidelidade"
              className="rounded-full border border-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Fidelidade
            </Link>
            <Link
              href="/painel/barbeiro/comunidade"
              className="rounded-full border border-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Meus posts
            </Link>
          </div>
        </div>
      )}

      <h2 className="mt-10 font-display text-3xl text-foreground">
        Todos os agendamentos
      </h2>
      <PainelAdminAgendamentos
        agendamentos={agendamentos ?? []}
        barbeiros={(barbeiros ?? []) as any[]}
      />
    </div>
  );
}
