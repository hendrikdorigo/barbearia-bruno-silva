import { PackageIcon } from "lucide-react";
import { valorPorVisita, type PacoteCliente } from "@/lib/pacotes-cliente";

/** Banner "usar o pacote X" com checkbox - some quando o cliente não tem
 * pacote válido pra data escolhida. Mesmo bloco nas duas telas de agendar. */
export default function SeletorPacote({
  pacote,
  usar,
  onChange,
}: {
  pacote: PacoteCliente;
  usar: boolean;
  onChange: (usar: boolean) => void;
}) {
  return (
    <div className="mt-6 rounded-xl border border-gold/50 bg-gold/10 p-4">
      <label className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-2">
          <PackageIcon className="mt-0.5 size-4 shrink-0 text-gold" />
          <span>
            <span className="block font-semibold text-foreground">Usar o pacote {pacote.nome}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {pacote.visitas_usadas} de {pacote.qtd_visitas_incluidas} visitas usadas · R${" "}
              {valorPorVisita(pacote).toFixed(2).replace(".", ",")} nesse agendamento
            </span>
          </span>
        </span>
        <input
          type="checkbox"
          checked={usar}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 size-4 accent-gold"
        />
      </label>
    </div>
  );
}
