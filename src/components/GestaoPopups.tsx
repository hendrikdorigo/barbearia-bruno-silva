"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-gold focus:outline-none";

export type AudienciaLogin = "logados" | "deslogados" | "ambos";

/** A coluna audiencia_login é texto livre no banco; isso garante que só um
 * dos três valores esperados chegue no componente. */
export function normalizarAudienciaLogin(valor: string): AudienciaLogin {
  return valor === "logados" || valor === "deslogados" || valor === "ambos" ? valor : "ambos";
}

type Popup = {
  id: string;
  titulo: string;
  tipo: "video" | "imagem" | "texto";
  conteudo_url: string | null;
  mensagem: string | null;
  publico: "todos" | "clientes" | "barbeiros";
  audiencia_login: AudienciaLogin;
  ativo: boolean;
  is_boas_vindas: boolean;
};

const AUDIENCIA_LABEL: Record<AudienciaLogin, string> = {
  logados: "Só quem já está logado",
  deslogados: "Só quem não está logado",
  ambos: "Logados e não logados",
};

export default function GestaoPopups({ popupsIniciais, userId }: { popupsIniciais: Popup[]; userId: string }) {
  const [popups, setPopups] = useState<Popup[]>(popupsIniciais);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"video" | "imagem" | "texto">("texto");
  const [mensagem, setMensagem] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [publico, setPublico] = useState<"todos" | "clientes" | "barbeiros">("todos");
  const [audienciaLogin, setAudienciaLogin] = useState<AudienciaLogin>("logados");
  const [isBoasVindas, setIsBoasVindas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function criar() {
    setErro(null);
    if (!titulo) {
      setErro("Dê um título ao pop-up.");
      return;
    }
    setSalvando(true);

    let conteudoUrl: string | null = null;
    if (tipo !== "texto" && arquivo) {
      const path = `popups/${Date.now()}-${arquivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("comunidade")
        .upload(path, arquivo, { upsert: true });
      if (uploadError) {
        setErro(uploadError.message);
        setSalvando(false);
        return;
      }
      conteudoUrl = supabase.storage.from("comunidade").getPublicUrl(path).data.publicUrl;
    }

    const { data: salvo, error } = await supabase
      .from("app_popups")
      .insert({
        titulo,
        tipo,
        conteudo_url: conteudoUrl,
        mensagem: mensagem || null,
        publico,
        audiencia_login: audienciaLogin,
        is_boas_vindas: isBoasVindas,
        criado_por: userId,
      })
      .select()
      .single();

    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setPopups((prev) => [salvo as Popup, ...prev]);
    setTitulo("");
    setMensagem("");
    setArquivo(null);
    router.refresh();
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("app_popups").update({ ativo: !ativo }).eq("id", id);
    setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !ativo } : p)));
    router.refresh();
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir este pop-up? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("app_popups").delete().eq("id", id);
    if (error) return;
    setPopups((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <Card className="border-border bg-ink-soft p-5">
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do pop-up"
          className="bg-background"
        />

        <div className="mt-3 flex gap-2">
          {(["texto", "imagem", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold uppercase transition-colors",
                tipo === t ? "bg-gold-gradient text-ink" : "border border-border text-muted-foreground hover:border-gold"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Mensagem"
          rows={3}
          className="mt-3 bg-background"
        />

        {tipo !== "texto" && (
          <Input
            type="file"
            accept={tipo === "imagem" ? "image/*" : "video/*"}
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="mt-3"
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Papel (quando logado)
            <select value={publico} onChange={(e) => setPublico(e.target.value as any)} className={selectClass}>
              <option value="todos">Todos</option>
              <option value="clientes">Só clientes</option>
              <option value="barbeiros">Só barbeiros</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Quem vê
            <select
              value={audienciaLogin}
              onChange={(e) => setAudienciaLogin(e.target.value as AudienciaLogin)}
              className={selectClass}
            >
              <option value="logados">Só quem está logado</option>
              <option value="deslogados">Só quem não está logado</option>
              <option value="ambos">Logados e não logados</option>
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Switch checked={isBoasVindas} onCheckedChange={setIsBoasVindas} />
            Vídeo/mensagem de boas-vindas (1º acesso)
          </label>
        </div>

        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

        <Button onClick={criar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Salvando..." : "Criar pop-up"}
        </Button>
      </Card>

      <div className="mt-5 space-y-2">
        {popups.map((p) => (
          <Card
            key={p.id}
            className={cn(
              "flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3",
              !p.ativo && "border-border/40 bg-ink-soft/40"
            )}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {p.titulo} {p.is_boas_vindas && "· boas-vindas"}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.tipo} · {p.publico} · {AUDIENCIA_LABEL[p.audiencia_login]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alternarAtivo(p.id, p.ativo)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full",
                  p.ativo
                    ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                    : "border-success/40 text-success hover:bg-success/10"
                )}
              >
                {p.ativo ? "Desativar" : "Ativar"}
              </button>
              <button
                onClick={() => excluir(p.id)}
                aria-label="Excluir pop-up"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                )}
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
