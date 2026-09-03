import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComandaView from "@/components/ComandaView";
import FichaCliente from "@/components/FichaCliente";

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
      .select(
        "*, clientes(profile_id, qtd_no_show, bloqueado, motivo_bloqueio, profiles(nome)), agendamentos(cliente_nome_avulso)"
      )
      .eq("agendamento_id", agendamentoId)
      .eq("barbeiro_id", user.id)
      .maybeSingle(),
    supabase.from("produtos").select("id, nome, preco, categoria").eq("ativo", true).order("categoria"),
  ]);

  if (!comanda) notFound();

  const clienteId = (comanda as any).cliente_id as string | null;

  const [{ data: itens }, { data: notas }, { data: pacotes }, { data: fiados }] = await Promise.all([
    supabase
      .from("comanda_itens")
      .select("id, produto_id, quantidade, preco_unitario, produtos(nome)")
      .eq("comanda_id", comanda.id),
    clienteId
      ? supabase
          .from("cliente_notas")
          .select("id, texto, created_at, profiles(nome)")
          .eq("cliente_id", clienteId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    clienteId
      ? supabase
          .from("pacotes_cliente")
          .select("*")
          .eq("cliente_id", clienteId)
          .eq("ativo", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    // Só enxerga fiados dos atendimentos feitos por este barbeiro (RLS) -
    // é um indicativo, o admin tem a visão completa no painel dele.
    clienteId
      ? supabase
          .from("comandas")
          .select("id, valor_servico, valor_produtos")
          .eq("cliente_id", clienteId)
          .eq("status", "fiado")
      : Promise.resolve({ data: [] }),
  ]);

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
      {clienteId && (
        <FichaCliente
          clienteId={clienteId}
          notasIniciais={(notas ?? []) as any}
          qtdNoShow={(comanda as any).clientes?.qtd_no_show ?? 0}
          autorId={user.id}
          bloqueadoInicial={Boolean((comanda as any).clientes?.bloqueado)}
          motivoBloqueioInicial={(comanda as any).clientes?.motivo_bloqueio ?? null}
          pacotes={(pacotes ?? []) as any}
          valorFiadoAberto={(fiados ?? []).reduce(
            (s, f: any) => s + Number(f.valor_servico) + Number(f.valor_produtos),
            0
          )}
        />
      )}
    </div>
  );
}
