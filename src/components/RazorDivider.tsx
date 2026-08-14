import { cn } from "@/lib/utils";

/**
 * Signature brand divider — a fine gold line with the crossed-scissors
 * glyph from the Bruno Silva monogram at its center. Used to mark section
 * breaks the way a razor stroke marks a fresh line.
 */
export default function RazorDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="presentation">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/70 to-gold/70" />
      <svg
        viewBox="0 0 24 24"
        className="size-4 shrink-0 text-gold"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="6" cy="18" r="2.2" />
        <line x1="7.8" y1="7.6" x2="20" y2="18.5" />
        <line x1="7.8" y1="16.4" x2="20" y2="5.5" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/70 to-gold/70" />
    </div>
  );
}
