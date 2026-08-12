import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortfolioEditor from "@/components/PortfolioEditor";

export default async function PortfolioBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!barbeiro) redirect("/");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-neutral-50">
        Meu portfólio
      </h1>
      <p className="mt-2 text-neutral-400">
        Essas informações aparecem na sua página pública para clientes.
      </p>
      <PortfolioEditor barbeiro={barbeiro} />
    </div>
  );
}
