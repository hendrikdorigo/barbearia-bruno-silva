import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/painel/DashboardShell";

export default async function PainelBarbeiroLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let souAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    souAdmin = profile?.role === "admin";
  }

  // Admin entrando pelas próprias páginas de barbeiro ("Minha agenda") continua
  // vendo o menu completo do admin (com o grupo "Minha agenda (barbeiro)"
  // destacando a seção atual) em vez de trocar pro menu enxuto do barbeiro
  // comum, que não tem como voltar pro painel admin.
  if (souAdmin) {
    return (
      <DashboardShell title="Painel admin" variant="admin" souBarbeiro>
        {children}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Painel do barbeiro" variant="barbeiro">
      {children}
    </DashboardShell>
  );
}
