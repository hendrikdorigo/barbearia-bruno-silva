import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/painel/DashboardShell";

export default async function PainelAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let souBarbeiro = false;
  if (user) {
    const { data } = await supabase
      .from("barbeiros")
      .select("profile_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    souBarbeiro = Boolean(data);
  }

  return (
    <DashboardShell title="Painel admin" variant="admin" souBarbeiro={souBarbeiro}>
      {children}
    </DashboardShell>
  );
}
