import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trocarCodePorTokens } from "@/lib/google-calendar";

// Callback do fluxo OAuth do Google Calendar.
// "state" carrega o profile_id do barbeiro que iniciou a conexão.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/painel/barbeiro?erro=Falha+na+autorizacao+do+Google", process.env.NEXT_PUBLIC_SITE_URL)
    );
  }

  try {
    const tokens = await trocarCodePorTokens(code);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // "state" carrega o profile_id de quem iniciou o fluxo em /api/google/connect;
    // confirma que é o mesmo usuário autenticado voltando do Google.
    if (!user || user.id !== state) {
      return NextResponse.redirect(
        new URL("/painel/barbeiro?erro=Sessao+invalida+ao+conectar+o+Google", process.env.NEXT_PUBLIC_SITE_URL)
      );
    }

    const { error: tokenError } = await supabase.from("google_calendar_tokens").upsert({
      barbeiro_id: user.id,
      access_token: tokens.access_token,
      // Google só reenvia refresh_token no primeiro consentimento (ou quando
      // prompt=consent força um novo, como aqui) - se por algum motivo vier
      // vazio, mantém o valor já salvo em vez de apagar um token valido.
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
      expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (tokenError) {
      return NextResponse.redirect(
        new URL("/painel/barbeiro?erro=Nao+foi+possivel+salvar+a+conexao+com+o+Google", process.env.NEXT_PUBLIC_SITE_URL)
      );
    }

    const { error: flagError } = await supabase
      .from("barbeiros")
      .update({ google_calendar_connected: true })
      .eq("profile_id", user.id);

    if (flagError) {
      return NextResponse.redirect(
        new URL("/painel/barbeiro?erro=Nao+foi+possivel+concluir+a+conexao+com+o+Google", process.env.NEXT_PUBLIC_SITE_URL)
      );
    }

    return NextResponse.redirect(
      new URL("/painel/barbeiro?sucesso=Google+Calendar+conectado", process.env.NEXT_PUBLIC_SITE_URL)
    );
  } catch (e) {
    return NextResponse.redirect(
      new URL("/painel/barbeiro?erro=Nao+foi+possivel+conectar+ao+Google", process.env.NEXT_PUBLIC_SITE_URL)
    );
  }
}
