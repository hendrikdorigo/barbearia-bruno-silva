import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Além dos estáticos, pula o refresh de sessão do Supabase (uma ida e
    // volta de rede) nas páginas públicas que não usam auth nenhuma — home,
    // tabela de preços, loja, política de privacidade e lista de barbeiros.
    // Páginas que checam o usuário (ex: /barbeiros/[id], /comunidade) e toda
    // a área logada continuam passando pelo middleware normalmente.
    "/((?!_next/static|_next/image|favicon.ico|servicos$|loja$|privacidade$|barbeiros$|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
