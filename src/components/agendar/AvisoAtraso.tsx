import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/**
 * Aviso da política de atraso/falta. Único ponto onde esse texto existe -
 * antes cada tela de agendamento tinha a sua versão, e elas chegaram a
 * divergir (uma mostrava dois avisos empilhados, e um deles tinha título de
 * atraso com texto de forma de pagamento).
 */
export default function AvisoAtraso({ className }: { className?: string }) {
  return (
    <Alert variant="destructive" className={cn("text-left", className)}>
      <AlertTriangleIcon />
      <AlertTitle className="uppercase tracking-wider">Atenção: atraso cancela o horário</AlertTitle>
      <AlertDescription>
        Se você atrasar ou não comparecer, o agendamento é cancelado automaticamente e o valor do
        serviço é somado à sua próxima visita — e assim por diante, se acontecer de novo.
      </AlertDescription>
    </Alert>
  );
}
