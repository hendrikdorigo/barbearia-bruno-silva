import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GestaoPrecosBarbeiro from "@/components/GestaoPrecosBarbeiro";

export default async function PrecosAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const [
    { data: barbeirosData },
    { data: servicos },
    { data: barbeiroServicos },
    { data: ajustes },
    { data: fidelidadeConfigs },
  ] = await Promise.all([
    supabase.from("barbeiros").select("profile_id, is_dono, profiles(nome)").eq("ativo", true),
    supabase.from("servicos").select("id, nome, preco, duracao_minutos").eq("ativo", true).order("preco"),
    supabase.from("barbeiro_servicos").select("barbeiro_id, servico_id, ativo, preco_personalizado"),
    supabase.from("servico_ajustes").select("*").order("created_at", { ascending: false }),
    supabase.from("fidelidade_config").select("*").order("meta_atendimentos"),
  ]);

  const barbeiros = (barbeirosData ?? [])
    .map((b: any) => ({ profile_id: b.profile_id, nome: b.profiles?.nome ?? "", is_dono: b.is_dono }))
    .sort((a, b) => (a.is_dono === b.is_dono ? a.nome.localeCompare(b.nome) : a.is_dono ? -1 : 1));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">Preços e fidelidade</h1>
      <p className="mt-2 text-muted-foreground">
        Só você mexe em preço, acréscimo/desconto e fidelidade — inclusive dos outros barbeiros.
        Eles só escolhem quais serviços oferecem.
      </p>
      <GestaoPrecosBarbeiro
        barbeiros={barbeiros}
        servicos={servicos ?? []}
        barbeiroServicos={barbeiroServicos ?? []}
        ajustes={ajustes ?? []}
        fidelidadeConfigs={fidelidadeConfigs ?? []}
      />
    </div>
  );
}
