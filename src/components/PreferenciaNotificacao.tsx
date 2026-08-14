"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PreferenciaNotificacao({
  profileId,
  ativoInicial,
}: {
  profileId: string;
  ativoInicial: boolean;
}) {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [salvando, setSalvando] = useState(false);
  const supabase = createClient();

  async function alternar() {
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notif_whatsapp_comunidade: !ativo })
      .eq("id", profileId);
    setSalvando(false);
    if (!error) setAtivo((a) => !a);
  }

  return (
    <label className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-ink-soft p-4 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={ativo}
        onChange={alternar}
        disabled={salvando}
        className="h-4 w-4 accent-[#C9A227]"
      />
      Avisar por WhatsApp quando um barbeiro postar na comunidade
    </label>
  );
}
