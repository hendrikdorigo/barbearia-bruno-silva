import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { normalizarCPF, validarCPF } from "@/lib/cpf";
import { emailSinteticoCPF, senhaDerivadaCPF } from "@/lib/auth-cliente";

/**
 * Cadastro de cliente sem senha - só CPF, nome e data de nascimento são
 * obrigatórios (e-mail é só um contato opcional, não usado para login).
 * Cria a conta via Admin API (e-mail sintético + senha derivada do CPF,
 * ver lib/auth-cliente.ts) e já loga o cliente automaticamente.
 */
export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const nome = body?.nome?.trim();
  const cpfDigits = normalizarCPF(body?.cpf ?? "");
  const telefone = body?.telefone?.trim() || null;
  const dataNascimento = body?.dataNascimento;
  const emailContato = body?.emailContato?.trim() || null;

  if (!nome || !dataNascimento) {
    return NextResponse.json({ error: "Preencha nome e data de nascimento." }, { status: 400 });
  }
  if (!validarCPF(cpfDigits)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  let senha: string;
  try {
    senha = senhaDerivadaCPF(cpfDigits);
  } catch {
    return NextResponse.json({ error: "Servidor não configurado (CPF_LOGIN_SECRET ausente)." }, { status: 500 });
  }

  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const email = emailSinteticoCPF(cpfDigits);

  const { data: novoUsuario, error: userError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome,
      telefone,
      cpf: cpfDigits,
      data_nascimento: dataNascimento,
      email_contato: emailContato,
    },
  });

  if (userError || !novoUsuario.user) {
    const jaExiste = userError?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: jaExiste
          ? "Esse CPF já tem cadastro. Faça login em vez de se cadastrar de novo."
          : (userError?.message ?? "Não foi possível criar o cadastro."),
      },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (loginError) {
    return NextResponse.json({
      success: true,
      autoLogin: false,
      userId: novoUsuario.user.id,
    });
  }

  return NextResponse.json({ success: true, autoLogin: true, userId: novoUsuario.user.id });
}
