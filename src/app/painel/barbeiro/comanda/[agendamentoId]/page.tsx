import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComandaView from "@/components/ComandaView";
import FichaCliente from "@/components/FichaCliente";
import FichaAvulso from "@/components/FichaAvulso";

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

  // Sem filtro por barbeiro_id aqui de propósito: a RLS já restringe um
  // barbeiro comum às próprias comandas, mas deixa o admin (Bruno) ver a
  // comanda de qualquer barbeiro a partir do painel de agendamentos.
  const [{ data: comanda }, { data: produtos }] = await Promise.all([
    supabase
      .from("comandas")
      .select(
        "*, clientes(profile_id, cpf, qtd_no_show, bloqueado, motivo_bloqueio, profiles(nome)), agendamentos(cliente_nome_avulso, cliente_cpf_avulso), barbeiros(profiles(nome))"
      )
      .eq("agendamento_id", agendamentoId)
      .maybeSingle(),
    supabase.from("produtos").select("id, nome, preco, categoria").eq("ativo", true).order("categoria"),
  ]);

  if (!comanda) notFound();

  const clienteId = (comanda as any).cliente_id as string | null;
  const cpfCliente = (comanda as any).clientes?.cpf as string | undefined;
  const cpfAvulso = (comanda as any).agendamentos?.cliente_cpf_avulso as string | null;

  const [
    { data: itens },
    { data: notas },
    { data: pacotes },
    { data: fiados },
    { data: notasAvulso },
    { count: noShowAvulso },
    { data: notasAvulsoAntigas },
  ] = await Promise.all([
    supabase
      .from("comanda_itens")
      .select("id, produto_id, quantidade, preco_unitario, produtos(nome)")
      .eq("comanda_id", comanda.id),
    clienteId
      ? supabase
          .from("cliente_notas")
          .select("id, texto, imagem_url, created_at, autor_id, profiles(nome)")
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
    // Fiados que a RLS deixa este usuário enxergar (barbeiro comum só vê os
    // seus próprios atendimentos; admin vê de todos os barbeiros).
    clienteId
      ? supabase
          .from("comandas")
          .select("id, valor_servico, valor_produtos")
          .eq("cliente_id", clienteId)
          .eq("status", "fiado")
      : Promise.resolve({ data: [] }),
    cpfAvulso
      ? supabase
          .from("notas_avulso")
          .select("id, texto, imagem_url, created_at, autor_id, profiles(nome)")
          .eq("cpf", cpfAvulso)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    cpfAvulso
      ? supabase
          .from("agendamentos")
          .select("id", { count: "exact", head: true })
          .eq("cliente_cpf_avulso", cpfAvulso)
          .eq("barbeiro_id", (comanda as any)?.barbeiro_id)
          .eq("status", "no_show")
      : Promise.resolve({ count: 0 }),
    // Cliente cadastrado que já tinha vindo como avulso antes (mesmo CPF):
    // traz as anotações daquela época pra dentro da ficha de verdade dele.
    clienteId && cpfCliente
      ? supabase
          .from("notas_avulso")
          .select("id, texto, imagem_url, created_at, autor_id, profiles(nome)")
          .eq("cpf", cpfCliente)
          .order("created_at", { ascending: false })
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
        {(comanda as any).barbeiro_id !== user.id && (comanda as any).barbeiros?.profiles?.nome && (
          <> Atendido por {(comanda as any).barbeiros.profiles.nome}.</>
        )}
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
          notasAvulsoAntigas={(notasAvulsoAntigas ?? []) as any}
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
      {!clienteId && (
        <FichaAvulso
          agendamentoId={agendamentoId}
          cpf={cpfAvulso}
          notasIniciais={(notasAvulso ?? []) as any}
          qtdNoShow={noShowAvulso ?? 0}
          autorId={user.id}
        />
      )}
    </div>
  );
}
