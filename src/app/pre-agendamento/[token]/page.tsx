"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ScissorsIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Detalhes = {
  status: "notificado" | "confirmado" | "recusado";
  dataHoraPrevista: string;
  nomeBarbeiro: string;
  nomeServico: string;
  preco: number | null;
};

export default function PreAgendamentoPage() {
  const { token } = useParams<{ token: string }>();
  const [carregando, setCarregando] = useState(true);
  const [detalhes, setDetalhes] = useState<Detalhes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<"confirmado" | "recusado" | null>(null);

  useEffect(() => {
    async function carregar() {
      const resp = await fetch(`/api/pre-agendamentos/${token}`);
      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        setErro(json?.error ?? "Link inválido.");
        setCarregando(false);
        return;
      }
      setDetalhes(json);
      setCarregando(false);
    }
    carregar();
  }, [token]);

  async function confirmar() {
    setProcessando(true);
    setErro(null);
    const resp = await fetch(`/api/pre-agendamentos/${token}/confirmar`, { method: "POST" });
    const json = await resp.json().catch(() => null);
    setProcessando(false);
    if (!resp.ok) {
      setErro(json?.error ?? "Não foi possível confirmar.");
      return;
    }
    setResultado("confirmado");
  }

  async function recusar() {
    setProcessando(true);
    setErro(null);
    const resp = await fetch(`/api/pre-agendamentos/${token}/recusar`, { method: "POST" });
    const json = await resp.json().catch(() => null);
    setProcessando(false);
    if (!resp.ok) {
      setErro(json?.error ?? "Não foi possível recusar.");
      return;
    }
    setResultado("recusado");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="border-border bg-ink-soft">
        <CardContent className="px-6 py-8 text-center">
          <ScissorsIcon className="mx-auto size-8 text-gold" />

          {carregando && <p className="mt-4 text-muted-foreground">Carregando...</p>}

          {!carregando && erro && !resultado && (
            <>
              <p className="mt-4 text-foreground">{erro}</p>
              <Link
                href="/agendar"
                className={cn(buttonVariants({ variant: "outline" }), "mt-6 uppercase tracking-widest")}
              >
                Agendar pelo app
              </Link>
            </>
          )}

          {!carregando && detalhes && !resultado && detalhes.status === "notificado" && (
            <>
              <p className="mt-4 font-display text-2xl text-foreground">Bora marcar?</p>
              <p className="mt-3 text-muted-foreground">
                {detalhes.nomeServico} com {detalhes.nomeBarbeiro} em{" "}
                <strong className="text-foreground">
                  {new Date(detalhes.dataHoraPrevista).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </strong>
                {detalhes.preco != null && (
                  <> · R$ {Number(detalhes.preco).toFixed(2).replace(".", ",")}</>
                )}
              </p>
              {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button disabled={processando} onClick={confirmar} className="uppercase tracking-widest">
                  Confirmar
                </Button>
                <Button
                  disabled={processando}
                  onClick={recusar}
                  variant="outline"
                  className="uppercase tracking-widest"
                >
                  Recusar
                </Button>
              </div>
            </>
          )}

          {!carregando && detalhes && detalhes.status !== "notificado" && !resultado && (
            <p className="mt-4 text-muted-foreground">Esse link já foi usado.</p>
          )}

          {resultado === "confirmado" && (
            <>
              <p className="mt-4 font-display text-2xl text-foreground">Marcado!</p>
              <p className="mt-3 text-muted-foreground">
                Seu horário foi reservado. Te esperamos na Barbearia Bruno Silva.
              </p>
            </>
          )}

          {resultado === "recusado" && (
            <>
              <p className="mt-4 font-display text-2xl text-foreground">Sem problemas!</p>
              <p className="mt-3 text-muted-foreground">Quando quiser, é só agendar pelo app.</p>
              <Link
                href="/agendar"
                className={cn(buttonVariants({ variant: "outline" }), "mt-6 uppercase tracking-widest")}
              >
                Agendar agora
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
