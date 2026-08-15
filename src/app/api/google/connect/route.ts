import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl, googleCalendarConfigurado } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const origem = request.nextUrl.origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origem));
  }

  if (!googleCalendarConfigurado()) {
    return NextResponse.redirect(
      new URL("/painel/barbeiro?erro=Google+Calendar+ainda+nao+configurado+pelo+administrador", origem)
    );
  }

  const url = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(url);
}
