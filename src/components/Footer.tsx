import Image from "next/image";
import Link from "next/link";
import { MapPinIcon, MessageCircleIcon } from "lucide-react";
import RazorDivider from "@/components/RazorDivider";

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

const EXPLORE_LINKS = [
  { href: "/barbeiros", label: "Barbeiros" },
  { href: "/servicos", label: "Serviços" },
  { href: "/loja", label: "Loja" },
  { href: "/comunidade", label: "Comunidade" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-ink-soft">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative h-10 w-10 shrink-0">
                <Image src="/logo-mark.png" alt="" fill sizes="40px" className="object-contain" />
              </span>
              <span className="font-display text-xl tracking-wide text-gold-gradient">
                BRUNO SILVA
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tradição e estilo em cada corte. Barbearia moderna, atendimento de respeito.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://www.instagram.com/bruno__hairstyle/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <InstagramGlyph />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <MessageCircleIcon className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Explorar</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Horário</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Todos os dias, 09h00 às 19h30
              <br />
              Slots de atendimento a cada 30 minutos
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Pagamento</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Crédito · Débito · Dinheiro · Pix
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold" />
              Rua 25 de Março, 351 — Limeira/SP
            </p>
          </div>
        </div>

        <RazorDivider className="my-8" />

        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Barbearia Bruno Silva. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
