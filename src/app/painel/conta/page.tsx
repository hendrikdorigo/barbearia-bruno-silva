import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AlterarCredenciais from "@/components/AlterarCredenciais";

export default async function PainelContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Conta</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">Minha conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Altere o e-mail ou a senha usados para entrar.
      </p>

      <AlterarCredenciais emailAtual={user.email ?? ""} />
    </div>
  );
}
