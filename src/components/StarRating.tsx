"use client";

import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (n: number) => void;
  size?: "md" | "lg";
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} estrelas`}
        >
          <StarIcon
            className={cn(
              size === "lg" ? "size-8" : "size-5",
              n <= value ? "fill-gold text-gold" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
