"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  nome: string;
  role: "cliente" | "barbeiro" | "admin";
};

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, role")
        .eq("id", user.id)
        .single();
      if (active) setProfile(data);

      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("lida", false);
      if (active) setNotifCount(count ?? 0);
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname, supabase]);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const painelHref =
    profile?.role === "admin"
      ? "/painel/admin"
      : profile?.role === "barbeiro"
        ? "/painel/barbeiro"
        : "/painel/cliente";

  return (
    <header className="sticky top-0 z-50 border-b border-ink-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="font-display text-2xl tracking-wide text-gold-gradient">
            BRUNO SILVA
          </span>
          <span className="hidden text-xs uppercase tracking-[0.3em] text-neutral-400 sm:inline">
            Barbearia
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-300 md:flex">
          <Link href="/barbeiros" className="hover:text-gold transition-colors">
            Barbeiros
          </Link>
          <Link href="/comunidade" className="hover:text-gold transition-colors">
            Comunidade
          </Link>
          <Link href="/servicos" className="hover:text-gold transition-colors">
            Serviços
          </Link>
          <Link href="/loja" className="hover:text-gold transition-colors">
            Loja
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link
                href="/notificacoes"
                className="relative rounded-full border border-ink-line p-2 text-neutral-300 hover:border-gold hover:text-gold"
                aria-label="Notificações"
              >
                🔔
                {notifCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink">
                    {notifCount}
                  </span>
                )}
              </Link>
              <Link
                href={painelHref}
                className="hidden rounded-full bg-gold-gradient px-4 py-1.5 text-sm font-semibold text-ink sm:inline-block"
              >
                {profile.nome.split(" ")[0]}
              </Link>
              <button
                onClick={sair}
                className="rounded-full border border-ink-line px-3 py-1.5 text-sm text-neutral-400 hover:border-gold hover:text-gold"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-300 hover:text-gold"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-gold-gradient px-4 py-1.5 text-sm font-semibold text-ink transition-transform hover:scale-105"
              >
                Agendar
              </Link>
            </>
          )}
          <button
            className="ml-1 text-neutral-300 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-3 border-t border-ink-line px-4 py-4 text-sm md:hidden">
          <Link href="/barbeiros" onClick={() => setOpen(false)}>
            Barbeiros
          </Link>
          <Link href="/comunidade" onClick={() => setOpen(false)}>
            Comunidade
          </Link>
          <Link href="/servicos" onClick={() => setOpen(false)}>
            Serviços
          </Link>
          <Link href="/loja" onClick={() => setOpen(false)}>
            Loja
          </Link>
          {profile && (
            <Link
              href={painelHref}
              onClick={() => setOpen(false)}
              className="font-semibold text-gold"
            >
              Meu painel
            </Link>
          )}
          {(profile?.role === "barbeiro" || profile?.role === "admin") && (
            <>
              <Link href="/painel/barbeiro/portfolio" onClick={() => setOpen(false)}>
                Editar portfólio
              </Link>
              <Link href="/painel/barbeiro/horarios" onClick={() => setOpen(false)}>
                Meus horários
              </Link>
              <Link href="/painel/barbeiro/servicos" onClick={() => setOpen(false)}>
                Meus serviços
              </Link>
              <Link href="/painel/barbeiro/fidelidade" onClick={() => setOpen(false)}>
                Fidelidade
              </Link>
              <Link href="/painel/barbeiro/comunidade" onClick={() => setOpen(false)}>
                Meus posts
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
