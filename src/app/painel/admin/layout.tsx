import DashboardShell from "@/components/painel/DashboardShell";

export default function PainelAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Painel admin" variant="admin">
      {children}
    </DashboardShell>
  );
}
