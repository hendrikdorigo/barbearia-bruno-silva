import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PainelAdminAgendamentos from "@/components/PainelAdminAgendamentos";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const BARBEIRO_LINKS = [
  { href: "/painel/barbeiro", label: "Minha agenda" },
  { href: "/painel/barbeiro/portfolio", label: "Editar meu portfólio" },
  { href: "/painel/barbeiro/horarios", label: "Meus horários" },
  { href: "/painel/barbeiro/servicos", label: "Meus serviços" },
  { href: "/painel/barbeiro/fidelidade", label: "Fidelidade" },
  { href: "/painel/barbeiro/comunidade", label: "Meus posts" },
];

export default async function PainelAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nome")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      "*, clientes(profile_id, profiles(nome)), barbeiros(profile_id, is_dono, profiles(nome)), servicos(nome)"
    )
    .order("data_hora", { ascending: false });

  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("profile_id, profiles(nome)")
    .eq("ativo", true);

  const { data: souBarbeiro } = await supabase
    .from("barbeiros")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Painel do Bruno
      </h1>

      {souBarbeiro && (
        <Alert className="mt-6 border-gold/40 bg-gold/10">
          <SparklesIcon className="text-gold" />
          <AlertTitle className="uppercase tracking-wider text-gold">
            Você também atende como barbeiro
          </AlertTitle>
          <div className="col-start-2 mt-3 flex flex-wrap gap-3">
            {BARBEIRO_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: i === 0 ? "default" : "outline", size: "sm" }),
                  "rounded-full uppercase tracking-widest",
                  i !== 0 && "border-gold text-gold hover:bg-gold/10"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Alert>
      )}

      <h2 className="mt-10 font-display text-3xl text-foreground">
        Todos os agendamentos
      </h2>
      <PainelAdminAgendamentos
        agendamentos={agendamentos ?? []}
        barbeiros={(barbeiros ?? []) as any[]}
      />
    </div>
  );
}
