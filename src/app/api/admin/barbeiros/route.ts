import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

/**
 * Cadastro de novos barbeiros parceiros pelo admin (Bruno).
 * Cria o usuário no Auth + profile + registro em `barbeiros`.
 * Requer SUPABASE_SERVICE_ROLE_KEY para poder criar usuários via Admin API.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Apenas o admin pode cadastrar barbeiros" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { nome, email, senha, telefone, bio, especialidades } = body;

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios" }, { status: 400 });
  }

  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: novoUsuario, error: userError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (userError || !novoUsuario.user) {
    return NextResponse.json({ error: userError?.message ?? "Erro ao criar usuário" }, { status: 400 });
  }

  const novoId = novoUsuario.user.id;

  await admin.from("profiles").insert({
    id: novoId,
    nome,
    role: "barbeiro",
    telefone: telefone ?? null,
  });

  await admin.from("barbeiros").insert({
    profile_id: novoId,
    is_dono: false,
    bio: bio ?? null,
    especialidades: especialidades ?? [],
  });

  return NextResponse.json({ success: true, id: novoId });
}

async function ehAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

// Ativa/desativa um barbeiro e/ou ajusta o percentual de comissão dele
// (remoção lógica preserva histórico de agendamentos; comissão afeta o
// trigger calcular_repasse_bruno() a partir do próximo agendamento).
export async function PATCH(request: NextRequest) {
  if (!(await ehAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
  const { profile_id, ativo, comissao_percentual } = await request.json();
  if (
    comissao_percentual !== undefined &&
    (typeof comissao_percentual !== "number" || comissao_percentual < 0 || comissao_percentual > 100)
  ) {
    return NextResponse.json({ error: "Comissão precisa ser um número entre 0 e 100." }, { status: 400 });
  }
  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const update: { ativo?: boolean; comissao_percentual?: number } = {};
  if (ativo !== undefined) update.ativo = ativo;
  if (comissao_percentual !== undefined) update.comissao_percentual = comissao_percentual;
  const { error } = await admin.from("barbeiros").update(update).eq("profile_id", profile_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
