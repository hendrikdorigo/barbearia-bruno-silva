import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GestaoProdutos from "@/components/GestaoProdutos";

export default async function GestaoLojaPage() {
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

  const { data: produtos } = await supabase.from("produtos").select("*").order("categoria");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Loja de produtos
      </h1>
      <p className="mt-2 text-muted-foreground">
        Gerencie os produtos disponíveis para clientes e barbeiros
        adicionarem nas comandas (bebidas, pomadas etc).
      </p>
      <GestaoProdutos produtosIniciais={produtos ?? []} />
    </div>
  );
}
