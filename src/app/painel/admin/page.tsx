import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelAdminAgendamentos from "@/components/PainelAdminAgendamentos";
import EstatisticasCards from "@/components/EstatisticasCards";
import FiltroPeriodo, { lerPeriodoDias } from "@/components/FiltroPeriodo";
import { calcularEstatisticas } from "@/lib/estatisticas";

const SELECT_AGENDAMENTOS =
  "*, clientes(profile_id, qtd_no_show, bloqueado, profiles(nome)), barbeiros(profile_id, is_dono, profiles(nome)), servicos(nome, preco, duracao_minutos), comandas(id, status, valor_produtos, valor_debito_no_show, comanda_itens(quantidade, preco_unitario, produtos(nome)))";

export default async function PainelAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias: diasParam } = await searchParams;
  const dias = lerPeriodoDias(diasParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sem recorte de período isso trazia todo o histórico da barbearia de uma
  // vez, com 5 joins aninhados - some com a performance conforme o movimento
  // cresce. O padrão de 90 dias cobre o uso do dia a dia e ainda garante que
  // os cards de hoje/semana/mês tenham todos os dados que precisam.
  const desde =
    dias > 0 ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString() : null;

  const consultaAgendamentos = supabase.from("agendamentos").select(SELECT_AGENDAMENTOS);

  const [{ data: profile }, { data: agendamentos }, { data: barbeiros }] = await Promise.all([
    supabase.from("profiles").select("role, nome").eq("id", user.id).single(),
    (desde ? consultaAgendamentos.gte("data_hora", desde) : consultaAgendamentos).order(
      "data_hora",
      { ascending: false }
    ),
    supabase.from("barbeiros").select("profile_id, profiles(nome)").eq("ativo", true),
  ]);

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Painel do Bruno
      </h1>

      <div className="mt-10">
        <EstatisticasCards
          titulo="Barbearia inteira"
          estatisticas={calcularEstatisticas(agendamentos ?? [])}
        />
      </div>

      {barbeiros && barbeiros.length > 0 && (
        <div className="mt-8 space-y-6">
          {barbeiros.map((b: any) => (
            <EstatisticasCards
              key={b.profile_id}
              titulo={b.profiles?.nome}
              estatisticas={calcularEstatisticas(
                (agendamentos ?? []).filter((a) => a.barbeiro_id === b.profile_id)
              )}
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl text-foreground">Agendamentos</h2>
        <FiltroPeriodo base="/painel/admin" dias={dias} />
      </div>
      <PainelAdminAgendamentos
        agendamentos={agendamentos ?? []}
        barbeiros={(barbeiros ?? []) as any[]}
      />
    </div>
  );
}
