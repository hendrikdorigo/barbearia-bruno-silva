import DashboardShell from "@/components/painel/DashboardShell";

export default function PainelBarbeiroLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Painel do barbeiro" variant="barbeiro">
      {children}
    </DashboardShell>
  );
}
