import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria: string | null;
  imagem_url?: string | null;
};

/** carrinho: produto_id -> quantidade escolhida (0 = fora do carrinho) */
export type Carrinho = Record<string, number>;

export function itensCarrinho(carrinho: Carrinho, produtos: Produto[]) {
  return produtos
    .filter((p) => (carrinho[p.id] ?? 0) > 0)
    .map((p) => ({ produto: p, quantidade: carrinho[p.id] }));
}

export function totalCarrinho(carrinho: Carrinho, produtos: Produto[]): number {
  return itensCarrinho(carrinho, produtos).reduce((soma, i) => soma + i.quantidade * Number(i.produto.preco), 0);
}

/**
 * Depois de criar o agendamento, joga os produtos escolhidos na comanda que o
 * gatilho do banco já cria automaticamente (1 comanda por agendamento) -
 * mesma tabela comanda_itens que o barbeiro usa pra adicionar produto na
 * comanda manualmente.
 */
export async function salvarProdutosNaComanda(
  supabase: SupabaseClient<Database>,
  agendamentoId: string,
  carrinho: Carrinho,
  produtos: Produto[]
): Promise<{ comandaId: string | null; erro: string | null }> {
  const itens = itensCarrinho(carrinho, produtos);
  if (itens.length === 0) return { comandaId: null, erro: null };

  const { data: comanda } = await supabase
    .from("comandas")
    .select("id")
    .eq("agendamento_id", agendamentoId)
    .maybeSingle();

  if (!comanda) {
    return {
      comandaId: null,
      erro: "Agendamento criado, mas não deu pra adicionar os produtos à comanda. Peça pro barbeiro adicionar na hora.",
    };
  }

  const { error } = await supabase.from("comanda_itens").insert(
    itens.map(({ produto, quantidade }) => ({
      comanda_id: comanda.id,
      produto_id: produto.id,
      quantidade,
      preco_unitario: produto.preco,
    }))
  );

  return {
    comandaId: comanda.id,
    erro: error
      ? "Agendamento criado, mas não deu pra adicionar os produtos à comanda. Peça pro barbeiro adicionar na hora."
      : null,
  };
}
