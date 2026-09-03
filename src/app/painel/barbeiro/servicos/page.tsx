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

  const [{ data: barbeiro }, { data: profile }, { data: servicos }, { data: barbeiroServicos }] =
    await Promise.all([
      supabase.from("barbeiros").select("profile_id").eq("profile_id", user.id).single(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("servicos")
        .select("id, nome, preco, duracao_minutos, imagem_url")
        .eq("ativo", true)
        .order("preco"),
      supabase.from("barbeiro_servicos").select("servico_id, ativo, preco_personalizado").eq("barbeiro_id", user.id),
    ]);

  if (!barbeiro) redirect("/");

  const isAdmin = profile?.role === "admin";

  const { data: ajustes } = isAdmin
    ? await supabase
        .from("servico_ajustes")
        .select("*")
        .eq("barbeiro_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Meus serviços
      </h1>
      <p className="mt-2 text-muted-foreground">
        Escolha quais serviços você oferece.
        {!isAdmin && " Preço e duração são definidos pelo Bruno."}
      </p>
      <ServicosEditor
        barbeiroId={user.id}
        servicos={servicos ?? []}
        barbeiroServicosIniciais={barbeiroServicos ?? []}
        isAdmin={isAdmin}
      />

      {isAdmin && (
        <>
          <h2 className="mt-14 font-display text-3xl tracking-wide text-foreground">
            Acréscimos e descontos
          </h2>
          <p className="mt-2 text-muted-foreground">
            Crie regras automáticas de acréscimo ou desconto para datas
            específicas (ex: feriado) ou para um dia da semana fixo (ex: toda
            sexta 10% off).
          </p>
          <AjustesPrecoEditor
            barbeiroId={user.id}
            servicos={servicos ?? []}
            ajustesIniciais={ajustes ?? []}
          />
        </>
      )}
    </div>
  );
}
