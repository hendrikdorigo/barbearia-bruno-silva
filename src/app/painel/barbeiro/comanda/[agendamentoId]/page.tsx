import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComandaView from "@/components/ComandaView";

export default async function ComandaBarbeiroPage({
  params,
}: {
  params: Promise<{ agendamentoId: string }>;
}) {
  const { agendamentoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: comanda }, { data: produtos }] = await Promise.all([
    supabase
      .from("comandas")
      .select("*, clientes(profile_id, profiles(nome)), agendamentos(cliente_nome_avulso)")
      .eq("agendamento_id", agendamentoId)
      .eq("barbeiro_id", user.id)
      .maybeSingle(),
    supabase.from("produtos").select("id, nome, preco, categoria").eq("ativo", true).order("categoria"),
  ]);

  if (!comanda) notFound();

  const { data: itens } = await supabase
    .from("comanda_itens")
    .select("id, produto_id, quantidade, preco_unitario, produtos(nome)")
    .eq("comanda_id", comanda.id);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl tracking-wide text-foreground">
        Comanda de{" "}
        {(comanda as any).clientes?.profiles?.nome ?? (comanda as any).agendamentos?.cliente_nome_avulso}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Adicione itens da loja e feche a conta quando o atendimento acabar.
      </p>
      <ComandaView
        comanda={comanda as any}
        itensIniciais={(itens ?? []) as any}
        produtos={(produtos ?? []) as any}
        papel="barbeiro"
      />
    </div>
  );
}
