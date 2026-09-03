import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelAdminAgendamentos from "@/components/PainelAdminAgendamentos";
import EstatisticasCards from "@/components/EstatisticasCards";
import { calcularEstatisticas } from "@/lib/estatisticas";

export default async function PainelAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: agendamentos }, { data: barbeiros }] = await Promise.all([
    supabase.from("profiles").select("role, nome").eq("id", user.id).single(),
    supabase
      .from("agendamentos")
      .select(
        "*, clientes(profile_id, qtd_no_show, bloqueado, profiles(nome)), barbeiros(profile_id, is_dono, profiles(nome)), servicos(nome, preco, duracao_minutos), comandas(id, status, valor_produtos, valor_debito_no_show, comanda_itens(quantidade, preco_unitario, produtos(nome)))"
      )
      .order("data_hora", { ascending: false }),
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
