import Link from "next/link";
import { ScissorsIcon, ClockIcon, CheckCircle2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * O status real do pagamento é decidido pelo webhook do Mercado Pago
 * (/api/pagamentos/mercadopago/webhook), não pelos parâmetros da URL de
 * retorno - por isso esta página consulta o agendamento no banco em vez de
 * confiar em query params, que podem chegar antes do webhook ou ser
 * manipulados.
 */
export default async function PagamentoRetornoPage({
  searchParams,
}: {
  searchParams: Promise<{ agendamento?: string }>;
}) {
  const { agendamento: agendamentoId } = await searchParams;
  const supabase = await createClient();

  const { data: agendamento } = agendamentoId
    ? await supabase.from("agendamentos").select("status").eq("id", agendamentoId).maybeSingle()
    : { data: null };

  const confirmado = agendamento?.status === "confirmado";

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      {confirmado ? (
        <>
          <CheckCircle2Icon className="mx-auto size-10 text-success" />
          <p className="mt-4 font-display text-3xl text-foreground">Pagamento confirmado!</p>
          <p className="mt-3 text-muted-foreground">
            Seu horário já está garantido. Você pode acompanhar os detalhes no seu painel.
          </p>
        </>
      ) : (
        <>
          <ClockIcon className="mx-auto size-10 text-gold" />
          <p className="mt-4 font-display text-3xl text-foreground">Estamos confirmando seu pagamento</p>
          <p className="mt-3 text-muted-foreground">
            Isso pode levar alguns instantes. Assim que o Mercado Pago confirmar, seu
            agendamento aparece como confirmado no seu painel automaticamente.
          </p>
        </>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/painel/cliente" className={cn(buttonVariants(), "rounded-full px-6 uppercase tracking-widest")}>
          Ver meus agendamentos
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6 uppercase tracking-widest")}
        >
          <ScissorsIcon data-icon="inline-start" />
          Início
        </Link>
      </div>
    </div>
  );
}
