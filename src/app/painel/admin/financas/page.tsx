import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FinancasPainel from "@/components/FinancasPainel";
import { limitesMes, listaMeses, mesAtualSP } from "@/lib/financas";

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const mesAtual = mesAtualSP();
  const { mes: mesParam } = await searchParams;
  const mes = mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : mesAtual;
  const { inicioISO, fimISO } = limitesMes(mes);

  const [
    { data: despesas },
    { data: agendamentosBrutos },
    { data: barbeirosOcultos },
    { data: extremos },
  ] = await Promise.all([
    supabase
      .from("despesas")
      .select("*, profiles!despesas_criado_por_fkey(nome)")
      .gte("data", `${mes}-01`)
      .lt("data", fimISO.slice(0, 10))
      .order("data", { ascending: false }),
    supabase
      .from("agendamentos")
      .select(
        "id, data_hora, valor_servico, valor_repasse_bruno, barbeiro_id, barbeiros(profile_id, is_dono), comandas(valor_produtos, valor_debito_no_show, valor_repasse_produtos)"
      )
      .in("status", ["confirmado", "concluido"])
      .gte("data_hora", inicioISO)
      .lt("data_hora", fimISO),
    supabase.from("barbeiros").select("profile_id").eq("oculto", true),
    supabase
      .from("agendamentos")
      .select("data_hora")
      .order("data_hora", { ascending: true })
      .limit(1),
  ]);

  const idsOcultos = new Set((barbeirosOcultos ?? []).map((b) => b.profile_id));
  const agendamentos = (agendamentosBrutos ?? []).filter((a) => !idsOcultos.has(a.barbeiro_id));

  const { data: despesaMaisAntiga } = await supabase
    .from("despesas")
    .select("data")
    .order("data", { ascending: true })
    .limit(1)
    .maybeSingle();

  const mesMaisAntigoAgendamento = extremos?.[0]?.data_hora ? extremos[0].data_hora.slice(0, 7) : mesAtual;
  const mesMaisAntigoDespesa = despesaMaisAntiga?.data ? despesaMaisAntiga.data.slice(0, 7) : mesAtual;
  const maisAntigo = mesMaisAntigoAgendamento < mesMaisAntigoDespesa ? mesMaisAntigoAgendamento : mesMaisAntigoDespesa;

  const meses = listaMeses(maisAntigo, mesAtual);
  // Garante que o mês escolhido pela URL sempre apareça na lista, mesmo que
  // seja um mês futuro/sem dados ainda (ex: alguém guardou o link).
  if (!meses.includes(mes)) meses.unshift(mes);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">Finanças</h1>
      <p className="mt-2 text-muted-foreground">
        Lance as despesas da barbearia e acompanhe o lucro do mês (faturamento dos
        atendimentos, menos comissões dos barbeiros parceiros, menos despesas).
      </p>

      <FinancasPainel
        mes={mes}
        meses={meses}
        agendamentos={agendamentos as any[]}
        despesasIniciais={(despesas ?? []) as any[]}
      />
    </div>
  );
}
