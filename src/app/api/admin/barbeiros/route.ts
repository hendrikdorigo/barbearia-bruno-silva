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

// Ativa/desativa um barbeiro, ajusta o percentual de comissão, ou edita os
// dados de cadastro (nome, telefone, bio, especialidades)
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
  const { profile_id, ativo, comissao_percentual, nome, telefone, bio, especialidades } = await request.json();
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id é obrigatório" }, { status: 400 });
  }
  if (
    comissao_percentual !== undefined &&
    (typeof comissao_percentual !== "number" || comissao_percentual < 0 || comissao_percentual > 100)
  ) {
    return NextResponse.json({ error: "Comissão precisa ser um número entre 0 e 100." }, { status: 400 });
  }
  if (nome !== undefined && !nome.trim()) {
    return NextResponse.json({ error: "Nome não pode ficar em branco." }, { status: 400 });
  }
  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  if (nome !== undefined || telefone !== undefined) {
    const perfilUpdate: { nome?: string; telefone?: string | null } = {};
    if (nome !== undefined) perfilUpdate.nome = nome.trim();
    if (telefone !== undefined) perfilUpdate.telefone = telefone || null;
    const { error } = await admin.from("profiles").update(perfilUpdate).eq("id", profile_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const update: {
    ativo?: boolean;
    comissao_percentual?: number;
    bio?: string | null;
    especialidades?: string[];
  } = {};
  if (ativo !== undefined) update.ativo = ativo;
  if (comissao_percentual !== undefined) update.comissao_percentual = comissao_percentual;
  if (bio !== undefined) update.bio = bio || null;
  if (especialidades !== undefined) update.especialidades = especialidades;
  if (Object.keys(update).length > 0) {
    const { error } = await admin.from("barbeiros").update(update).eq("profile_id", profile_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

// Exclui de vez um barbeiro cadastrado por engano. Só é permitido quando ele
// nunca teve nenhum agendamento (histórico de comandas/repasses depende da
// referência ao barbeiro); com histórico, o admin precisa usar "Desativar".
export async function DELETE(request: NextRequest) {
  if (!(await ehAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }
  const { profile_id } = await request.json();
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id é obrigatório" }, { status: 400 });
  }

  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: barbeiro } = await admin
    .from("barbeiros")
    .select("is_dono")
    .eq("profile_id", profile_id)
    .single();
  if (barbeiro?.is_dono) {
    return NextResponse.json({ error: "O dono não pode ser excluído." }, { status: 400 });
  }

  const { count } = await admin
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("barbeiro_id", profile_id);
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Esse barbeiro já tem agendamentos no histórico. Use \"Desativar\" em vez de excluir." },
      { status: 400 }
    );
  }

  const { error: barbeiroError } = await admin.from("barbeiros").delete().eq("profile_id", profile_id);
  if (barbeiroError) return NextResponse.json({ error: barbeiroError.message }, { status: 400 });

  await admin.from("profiles").delete().eq("id", profile_id);
  await admin.auth.admin.deleteUser(profile_id);

  return NextResponse.json({ success: true });
}
