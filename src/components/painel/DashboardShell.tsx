"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  ScissorsIcon,
  GiftIcon,
  ImageIcon,
  MessagesSquareIcon,
  LayoutDashboardIcon,
  UsersIcon,
  ShoppingBagIcon,
  MegaphoneIcon,
  WalletIcon,
  PercentIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV_ITEMS = {
  barbeiro: [
    { href: "/painel/barbeiro", label: "Agenda", icon: CalendarDaysIcon },
    { href: "/painel/barbeiro/horarios", label: "Horários", icon: ClockIcon },
    { href: "/painel/barbeiro/servicos", label: "Serviços", icon: ScissorsIcon },
    { href: "/painel/barbeiro/fidelidade", label: "Fidelidade", icon: GiftIcon },
    { href: "/painel/barbeiro/portfolio", label: "Portfólio", icon: ImageIcon },
    { href: "/painel/barbeiro/comunidade", label: "Comunidade", icon: MessagesSquareIcon },
  ],
  admin: [
    { href: "/painel/admin", label: "Agendamentos", icon: LayoutDashboardIcon },
    { href: "/painel/admin/barbeiros", label: "Barbeiros", icon: UsersIcon },
    { href: "/painel/admin/loja", label: "Loja", icon: ShoppingBagIcon },
    { href: "/painel/admin/popups", label: "Pop-ups", icon: MegaphoneIcon },
    { href: "/painel/admin/repasses", label: "Repasses", icon: WalletIcon },
    { href: "/painel/admin/pagamentos", label: "Pagamentos", icon: PercentIcon },
  ],
} as const;

export default function DashboardShell({
  title,
  variant,
  children,
}: {
  title: string;
  variant: "barbeiro" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[variant];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 px-1 py-1">
            <span className="relative size-7 shrink-0">
              <Image src="/logo-mark.png" alt="" fill sizes="28px" className="object-contain" />
            </span>
            <span className="font-display text-base tracking-wide text-gold-gradient group-data-[collapsible=icon]:hidden">
              {title}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Voltar ao site" render={<Link href="/" />}>
                <ArrowLeftIcon />
                <span>Voltar ao site</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-display text-sm tracking-wide text-gold-gradient">{title}</span>
        </header>
        <div className="flex-1 px-4 py-8 sm:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
