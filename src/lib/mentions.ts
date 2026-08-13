import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Extrai menções do tipo @Nome do texto e resolve para profile_id.
 * Ex: "Ficou top @Bruno Silva, valeu!" -> procura profile "Bruno Silva".
 */
export async function extrairMencoes(
  supabase: SupabaseClient,
  texto: string
): Promise<string[]> {
  const tokens = texto.match(/@([\p{L}0-9_.]+(?:\s[\p{L}0-9_.]+)?)/gu);
  if (!tokens || tokens.length === 0) return [];

  const nomes = Array.from(new Set(tokens.map((t) => t.slice(1).trim()))).filter(
    (n) => n.length > 1
  );
  if (nomes.length === 0) return [];

  const ids: string[] = [];
  for (const nome of nomes) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("nome", `%${nome}%`)
      .limit(1);
    if (data && data[0]) ids.push(data[0].id);
  }
  return Array.from(new Set(ids));
}
