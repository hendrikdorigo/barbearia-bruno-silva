import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { normalizarCPF, validarCPF } from "@/lib/cpf";
import { emailSinteticoCPF, senhaDerivadaCPF } from "@/lib/auth-cliente";

const JANELA_MINUTOS = 15;
const MAX_TENTATIVAS_CPF = 8;
// Bem mais folgado que o limite por CPF: uma rede compartilhada (barbearia,
// wi-fi público) pode gerar várias tentativas legítimas do mesmo IP, mas
// ninguém varrendo CPFs em sequência passa despercebido por esse teto.
const MAX_TENTATIVAS_IP = 30;

function extrairIp(request: NextRequest): string | null {
  // Vercel injeta x-forwarded-for com o IP real do cliente na frente da
  // lista (os próximos são proxies intermediários).
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

/**
 * Login de cliente só com CPF. Como o CPF é a única credencial (sem senha
 * nem segundo fator), aplica um limite de tentativas por CPF numa janela de
 * tempo - não impede alguém que já sabe o CPF de uma pessoa específica, mas
 * dificulta tentativas automatizadas testando vários CPFs. O limite por IP
 * complementa isso: sem ele, alguém varrendo CPFs diferentes nunca esbarra
 * em limite nenhum, porque cada CPF começa com contagem zerada.
 */
export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const cpfDigits = normalizarCPF(body?.cpf ?? "");
  if (!validarCPF(cpfDigits)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  const ip = extrairIp(request);
  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const desde = new Date(Date.now() - JANELA_MINUTOS * 60_000).toISOString();
  const [{ count: tentativasCpf }, { count: tentativasIp }] = await Promise.all([
    admin
      .from("login_tentativas")
      .select("id", { count: "exact", head: true })
      .eq("cpf", cpfDigits)
      .gte("criado_em", desde),
    ip
      ? admin
          .from("login_tentativas")
          .select("id", { count: "exact", head: true })
          .eq("ip", ip)
          .gte("criado_em", desde)
      : Promise.resolve({ count: 0 }),
  ]);

  if ((tentativasCpf ?? 0) >= MAX_TENTATIVAS_CPF) {
    return NextResponse.json(
      { error: "Muitas tentativas para esse CPF. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }
  if ((tentativasIp ?? 0) >= MAX_TENTATIVAS_IP) {
    return NextResponse.json(
      { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  await admin.from("login_tentativas").insert({ cpf: cpfDigits, ip });

  let senha: string;
  try {
    senha = senhaDerivadaCPF(cpfDigits);
  } catch {
    return NextResponse.json({ error: "Servidor não configurado (CPF_LOGIN_SECRET ausente)." }, { status: 500 });
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailSinteticoCPF(cpfDigits),
    password: senha,
  });

  if (error) {
    return NextResponse.json({ error: "CPF não encontrado. Verifique ou cadastre-se." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
