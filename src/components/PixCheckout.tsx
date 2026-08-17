"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2Icon, CopyIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * Modal de pagamento Pix: chama `criarEndpoint` para gerar a cobrança no
 * Mercado Pago, mostra o QR Code + código copia-e-cola, e fica consultando
 * GET /api/pagamentos/mercadopago/status a cada poucos segundos até o
 * pagamento ser aprovado (chama onConfirmado() quando isso acontece).
 */
export default function PixCheckout({
  open,
  onClose,
  criarEndpoint,
  corpo,
  valor,
  onConfirmado,
}: {
  open: boolean;
  onClose: () => void;
  criarEndpoint: string;
  corpo: Record<string, unknown>;
  valor: number;
  onConfirmado: () => void;
}) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [aprovado, setAprovado] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setAprovado(false);
    setQrCodeBase64(null);
    setPaymentId(null);

    fetch(criarEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })
      .then((r) => r.json().then((json) => ({ ok: r.ok, json })))
      .then(({ ok, json }) => {
        if (cancelado) return;
        if (!ok || !json?.qrCodeBase64) {
          setErro(json?.error ?? "Não foi possível gerar o Pix. Tente novamente.");
          setCarregando(false);
          return;
        }
        setQrCodeBase64(json.qrCodeBase64);
        setQrCode(json.qrCode);
        setPaymentId(json.paymentId);
        setCarregando(false);
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Não foi possível gerar o Pix. Tente novamente.");
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
    // Só refaz quando o dialog reabre - corpo/criarEndpoint não mudam durante uma sessão de pagamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!paymentId || aprovado) return;
    pollRef.current = setInterval(async () => {
      const resp = await fetch(`/api/pagamentos/mercadopago/status?paymentId=${paymentId}`);
      const json = await resp.json().catch(() => null);
      if (json?.status === "approved") {
        setAprovado(true);
        if (pollRef.current) clearInterval(pollRef.current);
        onConfirmado();
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentId, aprovado, onConfirmado]);

  function copiar() {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pagar com Pix</DialogTitle>
          <DialogDescription>
            R$ {valor.toFixed(2).replace(".", ",")} · Escaneie o QR Code ou copie o código no app do seu banco.
          </DialogDescription>
        </DialogHeader>

        {carregando && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2Icon className="size-6 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
          </div>
        )}

        {erro && !carregando && (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive">{erro}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}

        {qrCodeBase64 && !aprovado && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code Pix"
              className="size-56 rounded-lg border border-border bg-white p-2"
            />
            <Button type="button" variant="outline" onClick={copiar} className="w-full">
              {copiado ? <CheckCircle2Icon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              {copiado ? "Código copiado!" : "Copiar código Pix"}
            </Button>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Aguardando confirmação do pagamento...
            </p>
          </div>
        )}

        {aprovado && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2Icon className="size-10 text-success" />
            <p className="font-semibold text-foreground">Pagamento aprovado!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
