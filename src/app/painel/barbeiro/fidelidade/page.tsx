import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FidelidadeEditor from "@/components/FidelidadeEditor";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { GiftIcon } from "lucide-react";

export default async function FidelidadeBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("profile_id")
    .eq("profile_id", user.id)
    .single();
  if (!barbeiro) redirect("/");

  const { data: configs } = await supabase
    .from("fidelidade_config")
    .select("*")
    .eq("barbeiro_id", user.id)
    .order("meta_atendimentos");

  const { data: progresso } = await supabase
    .from("fidelidade_progresso")
    .select("*, clientes(profile_id, profiles(nome))")
    .eq("barbeiro_id", user.id)
    .order("atendimentos_concluidos", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Programa de fidelidade
      </h1>
      <p className="mt-2 text-muted-foreground">
        Crie conquistas automáticas: a cada X atendimentos concluídos, o
        cliente recebe uma notificação de brinde. Você decide o prêmio.
      </p>
      <FidelidadeEditor barbeiroId={user.id} configsIniciais={configs ?? []} />

      <h2 className="mt-14 font-display text-3xl tracking-wide text-foreground">
        Progresso dos clientes
      </h2>
      <div className="mt-4">
        {progresso?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progresso.map((p: any) => (
                <TableRow key={`${p.barbeiro_id}-${p.cliente_id}`}>
                  <TableCell className="font-medium text-foreground">
                    {p.clientes?.profiles?.nome ?? "Cliente"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gold">
                    {p.atendimentos_concluidos}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GiftIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhum histórico ainda</EmptyTitle>
              <EmptyDescription>
                Quando atendimentos forem concluídos, o progresso aparece aqui.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
