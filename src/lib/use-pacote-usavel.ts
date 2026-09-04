import { useEffect, useMemo, useState } from "react";
import { pacoteUsavelNaData, type PacoteCliente } from "@/lib/pacotes-cliente";

/**
 * Acha o pacote do cliente que vale pra data escolhida e liga o uso dele por
 * padrão sempre que muda (o cliente pode desmarcar na tela se preferir pagar
 * avulso). Mesma lógica nas duas telas de agendamento - extraída daqui pra
 * não voltar a divergir entre elas.
 */
export function usePacoteUsavel(pacotes: PacoteCliente[], data: string) {
  const [usarPacote, setUsarPacote] = useState(false);

  const pacoteUsavel = useMemo(
    () => pacotes.find((p) => pacoteUsavelNaData(p, data)) ?? null,
    [pacotes, data]
  );

  useEffect(() => {
    setUsarPacote(Boolean(pacoteUsavel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacoteUsavel?.id]);

  return { pacoteUsavel, usarPacote, setUsarPacote };
}
