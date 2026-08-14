"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

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
    <Card className="mt-4 border-border bg-ink-soft p-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="notif-whatsapp" className="text-sm text-muted-foreground">
            Avisar por WhatsApp quando um barbeiro postar na comunidade
          </FieldLabel>
        </FieldContent>
        <Switch
          id="notif-whatsapp"
          checked={ativo}
          onCheckedChange={alternar}
          disabled={salvando}
        />
      </Field>
    </Card>
  );
}
