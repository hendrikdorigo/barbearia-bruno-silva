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

    await supabase
      .from("barbeiros")
      .update({
        google_calendar_connected: true,
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token ?? null,
        google_calendar_token_expiry: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
      .eq("profile_id", state);

    return NextResponse.redirect(
      new URL("/painel/barbeiro?sucesso=Google+Calendar+conectado", process.env.NEXT_PUBLIC_SITE_URL)
    );
  } catch (e) {
    return NextResponse.redirect(
      new URL("/painel/barbeiro?erro=Nao+foi+possivel+conectar+ao+Google", process.env.NEXT_PUBLIC_SITE_URL)
    );
  }
}
