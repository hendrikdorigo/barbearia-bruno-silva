import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PacotesClienteManager from "@/components/PacotesClienteManager";

export default async function PacotesAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">Pacotes e assinaturas</h1>
      <p className="mt-2 text-muted-foreground">
        Busque um cliente e crie condições personalizadas pra ele - dias da semana válidos, período de
        vigência e observações detalhadas (como funciona o pagamento, o que está incluso, etc). O cliente
        vê tudo isso no painel dele.
      </p>
      <PacotesClienteManager autorId={user.id} />
    </div>
  );
}
