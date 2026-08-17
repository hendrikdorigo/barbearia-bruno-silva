import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AlterarCredenciais from "@/components/AlterarCredenciais";
import AvatarUploader from "@/components/AvatarUploader";

export default async function PainelContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, avatar_url, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Conta</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">Minha conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Altere sua foto, e-mail ou senha usados para entrar.
      </p>

      <div className="mt-8">
        <AvatarUploader
          userId={user.id}
          avatarUrl={perfil?.avatar_url ?? null}
          nome={perfil?.nome ?? user.email ?? "?"}
          syncClienteFoto={perfil?.role === "cliente"}
        />
      </div>

      <AlterarCredenciais emailAtual={user.email ?? ""} />
    </div>
  );
}
