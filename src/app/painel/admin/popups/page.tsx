import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GestaoPopups from "@/components/GestaoPopups";

export default async function GestaoPopupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: popups } = await supabase
    .from("app_popups")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Pop-ups do app
      </h1>
      <p className="mt-2 text-muted-foreground">
        Envie avisos, promoções ou vídeos que aparecem quando o cliente ou
        barbeiro abre o app. Marque como &quot;boas-vindas&quot; para exibir
        automaticamente no primeiro acesso de cada novo cliente.
      </p>
      <GestaoPopups popupsIniciais={popups ?? []} userId={user.id} />
    </div>
  );
}
