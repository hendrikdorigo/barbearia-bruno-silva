import Link from "next/link";
import { ScissorsIcon, ClockIcon, CheckCircle2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * O status real vem do webhook do Mercado Pago (assíncrono), não dos query
 * params da URL de retorno - por isso consulta a comanda no banco.
 */
export default async function PagamentoRetornoComandaPage({
  searchParams,
}: {
  searchParams: Promise<{ comanda?: string }>;
}) {
  const { comanda: comandaId } = await searchParams;
  const supabase = await createClient();

  const { data: comanda } = comandaId
    ? await supabase.from("comandas").select("status, agendamento_id").eq("id", comandaId).maybeSingle()
    : { data: null };

  const pago = comanda?.status === "paga" || comanda?.status === "fechada";
  const voltarHref = comanda ? `/painel/cliente/comanda/${comanda.agendamento_id}` : "/painel/cliente";

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      {pago ? (
        <>
          <CheckCircle2Icon className="mx-auto size-10 text-success" />
          <p className="mt-4 font-display text-3xl text-foreground">Pagamento confirmado!</p>
          <p className="mt-3 text-muted-foreground">
            Sua comanda foi paga. Ela será fechada pelo barbeiro ao final do atendimento.
          </p>
        </>
      ) : (
        <>
          <ClockIcon className="mx-auto size-10 text-gold" />
          <p className="mt-4 font-display text-3xl text-foreground">Estamos confirmando seu pagamento</p>
          <p className="mt-3 text-muted-foreground">
            Isso pode levar alguns instantes. Assim que o Mercado Pago confirmar, sua
            comanda aparece como paga automaticamente.
          </p>
        </>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href={voltarHref} className={cn(buttonVariants(), "rounded-full px-6 uppercase tracking-widest")}>
          Ver comanda
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
