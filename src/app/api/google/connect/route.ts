import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl, googleCalendarConfigurado } from "@/lib/google-calendar";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL));
  }

  if (!googleCalendarConfigurado()) {
    return NextResponse.redirect(
      new URL(
        "/painel/barbeiro?erro=Google+Calendar+ainda+nao+configurado+pelo+administrador",
        process.env.NEXT_PUBLIC_SITE_URL
      )
    );
  }

  const url = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(url);
}
