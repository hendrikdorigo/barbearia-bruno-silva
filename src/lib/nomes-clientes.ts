import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Busca nomes de clientes diretamente em `profiles` (leitura publica) em vez
 * de via `clientes(profiles(nome))` - a RLS de `clientes` só libera SELECT
 * para o próprio cliente, o barbeiro com quem ele tem agendamento, ou admin,
 * então esse join embutido retorna null (e cai no fallback "Cliente") para
 * qualquer outro visitante da página, que é o caso mais comum em páginas
 * públicas como /comunidade e /barbeiros/[id].
 */
export async function buscarNomesClientes(
  supabase: SupabaseClient<Database>,
  clienteIds: (string | null | undefined)[]
): Promise<Record<string, string>> {
  const ids = Array.from(new Set(clienteIds.filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return {};

  const { data } = await supabase.from("profiles").select("id, nome").in("id", ids);
  const mapa: Record<string, string> = {};
  for (const p of data ?? []) mapa[p.id] = p.nome;
  return mapa;
}
