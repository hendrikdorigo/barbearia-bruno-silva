"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BellIcon,
  MenuIcon,
  ScissorsIcon,
  UserIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  nome: string;
  role: "cliente" | "barbeiro" | "admin";
  avatar_url: string | null;
};

const NAV_LINKS = [
  { href: "/agendar", label: "Agendar" },
  { href: "/barbeiros", label: "Barbeiros" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/servicos", label: "Serviços" },
  { href: "/loja", label: "Loja" },
];

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
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
        .select("id, nome, role, avatar_url")
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

  const barberLinks =
    profile?.role === "barbeiro"
      ? [
          { href: "/painel/barbeiro/portfolio", label: "Editar portfólio" },
          { href: "/painel/barbeiro/horarios", label: "Meus horários" },
          { href: "/painel/barbeiro/servicos", label: "Meus serviços" },
          { href: "/painel/barbeiro/fidelidade", label: "Fidelidade" },
          { href: "/painel/barbeiro/comunidade", label: "Meus posts" },
        ]
      : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Página inicial">
          <span className="relative h-9 w-9 shrink-0">
            <Image
              src="/logo-mark.png"
              alt=""
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-wide text-gold-gradient">
              BRUNO SILVA
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.35em] text-muted-foreground sm:inline">
              Barbearia
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1 transition-colors hover:text-foreground",
                  active && "text-foreground"
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-[1px] left-0 h-px w-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <Link
                href="/notificacoes"
                aria-label="Notificações"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "relative"
                )}
              >
                <BellIcon />
                {notifCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                  >
                    {notifCount}
                  </Badge>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="secondary"
                      className="hidden gap-2 rounded-full pl-2 pr-3 sm:inline-flex"
                    />
                  }
                >
                  <Avatar size="sm">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
                    <AvatarFallback className="bg-gold-gradient text-xs font-bold text-ink">
                      {profile.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {profile.nome.split(" ")[0]}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="truncate">{profile.nome}</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href={painelHref} />}>
                      <LayoutDashboardIcon data-icon="inline-start" />
                      Meu painel
                    </DropdownMenuItem>
                    {barberLinks.map((link) => (
                      <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                        {link.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem render={<Link href="/painel/conta" />}>
                      <SettingsIcon data-icon="inline-start" />
                      Minha conta
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={sair}>
                    <LogOutIcon data-icon="inline-start" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                Entrar
              </Link>
              <Link href="/cadastro" className={buttonVariants()}>
                Agendar horário
              </Link>
            </div>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "md:hidden"
              )}
              aria-label="Menu"
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-display text-lg tracking-wide">
                  <ScissorsIcon className="size-4 text-gold" />
                  Bruno Silva
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground/90 hover:bg-accent hover:text-accent-foreground"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}

                {profile ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <SheetClose
                      render={
                        <Link
                          href={painelHref}
                          className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-semibold text-gold hover:bg-accent"
                        />
                      }
                    >
                      <LayoutDashboardIcon className="size-4" />
                      Meu painel
                    </SheetClose>
                    {barberLinks.map((link) => (
                      <SheetClose
                        key={link.href}
                        render={
                          <Link
                            href={link.href}
                            className="rounded-md px-2 py-2.5 pl-8 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    ))}
                    <SheetClose
                      render={
                        <Link
                          href="/painel/conta"
                          className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
                        />
                      }
                    >
                      <SettingsIcon className="size-4" />
                      Minha conta
                    </SheetClose>
                    <div className="my-2 h-px bg-border" />
                    <button
                      onClick={() => {
                        setSheetOpen(false);
                        sair();
                      }}
                      className="flex items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOutIcon className="size-4" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <SheetClose
                      render={
                        <Link
                          href="/login"
                          className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium hover:bg-accent"
                        />
                      }
                    >
                      <UserIcon className="size-4" />
                      Entrar
                    </SheetClose>
                    <SheetClose
                      render={
                        <Link
                          href="/cadastro"
                          className={cn(buttonVariants(), "mt-2 w-full")}
                        />
                      }
                    >
                      Agendar horário
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
