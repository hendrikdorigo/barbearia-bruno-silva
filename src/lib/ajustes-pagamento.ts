export type AjusteFormaPagamento = {
  forma_pagamento: string;
  ativo: boolean;
  tipo: "desconto" | "acrescimo";
  valor_tipo: "percentual" | "fixo";
  valor: number;
};

/** Aplica o ajuste (desconto/acréscimo) configurado pelo Bruno pra essa forma de pagamento, se ativo. */
export function aplicarAjusteFormaPagamento(
  preco: number,
  forma: string,
  ajustes: AjusteFormaPagamento[]
): number {
  const a = ajustes.find((x) => x.forma_pagamento === forma && x.ativo);
  if (!a) return preco;
  const delta = a.valor_tipo === "percentual" ? (preco * Number(a.valor)) / 100 : Number(a.valor);
  const resultado = a.tipo === "desconto" ? preco - delta : preco + delta;
  return Math.max(0, Math.round(resultado * 100) / 100);
}

/** Texto curto pro selo da forma de pagamento (ex: "-10%", "+R$ 2,00"), se houver ajuste ativo. */
export function seloAjusteFormaPagamento(forma: string, ajustes: AjusteFormaPagamento[]): string | null {
  const a = ajustes.find((x) => x.forma_pagamento === forma && x.ativo);
  if (!a || Number(a.valor) <= 0) return null;
  const sinal = a.tipo === "desconto" ? "-" : "+";
  const valorTexto =
    a.valor_tipo === "percentual"
      ? `${Number(a.valor)}%`
      : `R$ ${Number(a.valor).toFixed(2).replace(".", ",")}`;
  return `${sinal}${valorTexto}`;
}
