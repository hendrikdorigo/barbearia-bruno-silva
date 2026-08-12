import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificacoesLista from "@/components/NotificacoesLista";

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notificacoes } = await supabase
    .from("notificacoes")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-neutral-50">
        Notificações
      </h1>
      <NotificacoesLista notificacoes={notificacoes ?? []} />
    </div>
  );
}
