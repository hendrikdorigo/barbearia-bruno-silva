import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DescontoAntecipadoEditor from "@/components/DescontoAntecipadoEditor";
import AjustesFormaPagamentoEditor from "@/components/AjustesFormaPagamentoEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function PagamentosAdminPage() {
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

  const [{ data: config }, { data: ajustesFormaPagamento }] = await Promise.all([
    supabase
      .from("configuracoes_pagamento")
      .select("id, desconto_pagamento_antecipado_percentual")
      .limit(1)
      .single(),
    supabase.from("ajustes_forma_pagamento").select("*"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">Pagamentos</h1>
      <p className="mt-2 text-muted-foreground">
        Configure o desconto para quem paga o horário antecipado, direto pelo app.
      </p>
      <Alert className="mt-4 border-gold/40 bg-gold/10">
        <AlertDescription className="text-foreground/90">
          O pagamento antecipado está pausado — os clientes não veem mais essa
          opção ao agendar. O desconto configurado aqui fica salvo e volta a
          valer quando o recurso for reativado.
        </AlertDescription>
      </Alert>
      {config && (
        <DescontoAntecipadoEditor
          configId={config.id}
          descontoInicial={Number(config.desconto_pagamento_antecipado_percentual)}
        />
      )}

      <h2 className="mt-10 font-display text-3xl tracking-wide text-foreground">
        Ajuste por forma de pagamento
      </h2>
      <AjustesFormaPagamentoEditor ajustesIniciais={(ajustesFormaPagamento ?? []) as any} />
    </div>
  );
}
