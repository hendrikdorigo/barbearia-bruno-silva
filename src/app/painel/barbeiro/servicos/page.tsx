import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ServicosEditor from "@/components/ServicosEditor";
import AjustesPrecoEditor from "@/components/AjustesPrecoEditor";

export default async function ServicosBarbeiroPage() {
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

  const { data: servicos } = await supabase
    .from("servicos")
    .select("id, nome, preco, duracao_minutos")
    .eq("ativo", true)
    .order("preco");

  const { data: barbeiroServicos } = await supabase
    .from("barbeiro_servicos")
    .select("servico_id, ativo, preco_personalizado")
    .eq("barbeiro_id", user.id);

  const { data: ajustes } = await supabase
    .from("servico_ajustes")
    .select("*")
    .eq("barbeiro_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-neutral-50">
        Meus serviços e preços
      </h1>
      <p className="mt-2 text-neutral-400">
        Escolha quais serviços você oferece e, se quiser, defina um preço
        próprio diferente do padrão da barbearia.
      </p>
      <ServicosEditor
        barbeiroId={user.id}
        servicos={servicos ?? []}
        barbeiroServicosIniciais={barbeiroServicos ?? []}
      />

      <h2 className="mt-14 font-display text-3xl tracking-wide text-neutral-50">
        Acréscimos e descontos
      </h2>
      <p className="mt-2 text-neutral-400">
        Crie regras automáticas de acréscimo ou desconto para datas
        específicas (ex: feriado) ou para um dia da semana fixo (ex: toda
        sexta 10% off).
      </p>
      <AjustesPrecoEditor
        barbeiroId={user.id}
        servicos={servicos ?? []}
        ajustesIniciais={ajustes ?? []}
      />
    </div>
  );
}
