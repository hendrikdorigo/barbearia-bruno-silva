"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ExcluirPostBotao({ postId, className }: { postId: string; className?: string }) {
  const [excluindo, setExcluindo] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function excluir() {
    if (!window.confirm("Excluir este post? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    await supabase.from("posts_comunidade").delete().eq("id", postId);
    setExcluindo(false);
    router.refresh();
  }

  return (
    <button
      onClick={excluir}
      disabled={excluindo}
      aria-label="Excluir post"
      className={cn(
        "text-muted-foreground/70 transition-colors hover:text-destructive disabled:opacity-50",
        className
      )}
    >
      <Trash2Icon className="size-4" />
    </button>
  );
}
