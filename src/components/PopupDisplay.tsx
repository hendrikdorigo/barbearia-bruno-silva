"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Popup = {
  id: string;
  titulo: string;
  tipo: "video" | "imagem" | "texto";
  conteudo_url: string | null;
  mensagem: string | null;
};

export default function PopupDisplay() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) return;

      const publicoAlvo = profile.role === "barbeiro" ? "barbeiros" : "clientes";

      const { data: jaVistos } = await supabase
        .from("popup_visualizacoes")
        .select("popup_id")
        .eq("profile_id", user.id);
      const vistosIds = (jaVistos ?? []).map((v) => v.popup_id);

      let query = supabase
        .from("app_popups")
        .select("*")
        .eq("ativo", true)
        .or(`publico.eq.todos,publico.eq.${publicoAlvo}`)
        .order("created_at", { ascending: true })
        .limit(1);

      if (vistosIds.length > 0) {
        query = query.not("id", "in", `(${vistosIds.join(",")})`);
      }

      const { data: popups } = await query;
      if (ativo && popups && popups[0]) {
        setPopup(popups[0] as Popup);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname === "/"]);

  async function fechar() {
    if (!popup) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("popup_visualizacoes")
        .insert({ popup_id: popup.id, profile_id: user.id });
    }
    setPopup(null);
  }

  if (!popup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gold/40 bg-ink-soft p-6">
        <p className="font-display text-2xl tracking-wide text-foreground">
          {popup.titulo}
        </p>

        {popup.tipo === "video" && popup.conteudo_url && (
          <video src={popup.conteudo_url} controls autoPlay className="mt-4 w-full rounded-lg" />
        )}
        {popup.tipo === "imagem" && popup.conteudo_url && (
          <img src={popup.conteudo_url} alt="" className="mt-4 w-full rounded-lg object-cover" />
        )}
        {popup.mensagem && <p className="mt-4 text-muted-foreground">{popup.mensagem}</p>}

        <button
          onClick={fechar}
          className="mt-6 w-full rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
