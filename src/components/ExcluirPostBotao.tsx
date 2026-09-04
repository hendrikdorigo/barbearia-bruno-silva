"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { cn } from "@/lib/utils";

export default function ExcluirPostBotao({ postId, className }: { postId: string; className?: string }) {
  const [excluindo, setExcluindo] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  async function excluir() {
    const ok = await confirmar({
      titulo: "Excluir este post?",
      descricao: "Essa ação não pode ser desfeita.",
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindo(true);
    const { error } = await supabase.from("posts_comunidade").delete().eq("id", postId);
    setExcluindo(false);
    if (error) {
      toast.error("Não foi possível excluir o post", { description: error.message });
      return;
    }
    toast.success("Post excluído.");
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
