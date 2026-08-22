import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortfolioEditor from "@/components/PortfolioEditor";

export default async function PortfolioBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: barbeiro }, { data: profile }, { data: itensPortfolio }] = await Promise.all([
    supabase.from("barbeiros").select("*").eq("profile_id", user.id).single(),
    supabase.from("profiles").select("nome, avatar_url").eq("id", user.id).single(),
    supabase.from("portfolio_itens").select("*").eq("barbeiro_id", user.id).order("ordem", { ascending: true }),
  ]);

  if (!barbeiro) redirect("/");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Meu portfólio
      </h1>
      <p className="mt-2 text-muted-foreground">
        Essas informações aparecem na sua página pública para clientes.
      </p>
      <PortfolioEditor
        barbeiro={barbeiro}
        profile={profile ?? { nome: "Barbeiro", avatar_url: null }}
        itensPortfolioIniciais={itensPortfolio ?? []}
      />
    </div>
  );
}
