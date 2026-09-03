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
  TagIcon,
  PackageIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const BARBEIRO_ITEMS = [
  { href: "/painel/barbeiro", label: "Agenda", icon: CalendarDaysIcon },
  { href: "/painel/barbeiro/horarios", label: "Horários", icon: ClockIcon },
  { href: "/painel/barbeiro/servicos", label: "Serviços", icon: ScissorsIcon },
  { href: "/painel/barbeiro/fidelidade", label: "Fidelidade", icon: GiftIcon },
  { href: "/painel/barbeiro/portfolio", label: "Portfólio", icon: ImageIcon },
  { href: "/painel/barbeiro/comunidade", label: "Comunidade", icon: MessagesSquareIcon },
];

const ADMIN_GROUPS = [
  {
    label: "Barbearia",
    items: [
      { href: "/painel/admin", label: "Agendamentos", icon: LayoutDashboardIcon },
      { href: "/painel/admin/barbeiros", label: "Barbeiros", icon: UsersIcon },
      { href: "/painel/admin/precos", label: "Preços e fidelidade", icon: TagIcon },
      { href: "/painel/admin/pacotes", label: "Pacotes e assinaturas", icon: PackageIcon },
    ],
  },
  {
    label: "Negócio",
    items: [
      { href: "/painel/admin/loja", label: "Loja", icon: ShoppingBagIcon },
      { href: "/painel/admin/popups", label: "Pop-ups", icon: MegaphoneIcon },
      { href: "/painel/admin/repasses", label: "Repasses", icon: WalletIcon },
      { href: "/painel/admin/pagamentos", label: "Pagamentos", icon: PercentIcon },
    ],
  },
];

export default function DashboardShell({
  title,
  variant,
  souBarbeiro = false,
  children,
}: {
  title: string;
  variant: "barbeiro" | "admin";
  souBarbeiro?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const groups =
    variant === "admin"
      ? [
          ...ADMIN_GROUPS,
          ...(souBarbeiro ? [{ label: "Minha agenda (barbeiro)", items: BARBEIRO_ITEMS }] : []),
        ]
      : [{ label: undefined as string | undefined, items: BARBEIRO_ITEMS }];

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
          {groups.map((group, i) => (
            <SidebarGroup key={group.label ?? i}>
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
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
          ))}
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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <span className="font-display text-sm tracking-wide text-gold-gradient">{title}</span>
        </header>
        <div className="flex-1 px-4 py-8 sm:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
