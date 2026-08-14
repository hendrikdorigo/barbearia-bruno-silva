"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function PortfolioEditor({ barbeiro }: { barbeiro: any }) {
  const [bio, setBio] = useState(barbeiro.bio ?? "");
  const [especialidades, setEspecialidades] = useState(
    (barbeiro.especialidades ?? []).join(", ")
  );
  const [imagens, setImagens] = useState<string[]>(barbeiro.portfolio_imagens ?? []);
  const [bannerUrl, setBannerUrl] = useState<string | null>(barbeiro.banner_url ?? null);
  const [novoBanner, setNovoBanner] = useState<File | null>(null);
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionarBanner() {
    if (!novoBanner) return;
    const path = `${barbeiro.profile_id}/banner-${Date.now()}-${novoBanner.name}`;
    const { error } = await supabase.storage
      .from("portfolio")
      .upload(path, novoBanner, { upsert: true });
    if (error) {
      setMensagem(error.message);
      return;
    }
    const url = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    setBannerUrl(url);
    setNovoBanner(null);
  }

  async function adicionarImagem() {
    if (!novaImagem) return;
    const path = `${barbeiro.profile_id}/${Date.now()}-${novaImagem.name}`;
    const { error } = await supabase.storage
      .from("portfolio")
      .upload(path, novaImagem, { upsert: true });
    if (error) {
      setMensagem(error.message);
      return;
    }
    const url = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    setImagens((prev) => [...prev, url]);
    setNovaImagem(null);
  }

  function removerImagem(url: string) {
    setImagens((prev) => prev.filter((i) => i !== url));
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    const { error } = await supabase
      .from("barbeiros")
      .update({
        bio,
        especialidades: especialidades
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        portfolio_imagens: imagens,
        banner_url: bannerUrl,
      })
      .eq("profile_id", barbeiro.profile_id);
    setSalvando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setMensagem("Portfólio atualizado!");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <label className="text-xs uppercase tracking-widest text-muted-foreground">
        Banner do perfil (imagem larga, estilo capa)
      </label>
      {bannerUrl && (
        <div className="relative h-32 w-full overflow-hidden rounded-lg">
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          <button
            onClick={() => setBannerUrl(null)}
            aria-label="Remover banner"
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setNovoBanner(e.target.files?.[0] ?? null)}
          className="flex-1"
        />
        <Button onClick={adicionarBanner} variant="outline" size="sm">
          Enviar banner
        </Button>
      </div>

      <label className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
        Descrição / bio
      </label>
      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="bg-ink-soft" />

      <label className="text-xs uppercase tracking-widest text-muted-foreground">
        Especialidades (separadas por vírgula)
      </label>
      <Input
        value={especialidades}
        onChange={(e) => setEspecialidades(e.target.value)}
        placeholder="Degradê, Barba desenhada, Corte social"
        className="bg-ink-soft"
      />

      <label className="text-xs uppercase tracking-widest text-muted-foreground">
        Imagens do portfólio
      </label>
      <div className="grid grid-cols-3 gap-3">
        {imagens.map((img) => (
          <div key={img} className="relative">
            <img src={img} alt="" className="h-24 w-full rounded-lg object-cover" />
            <button
              onClick={() => removerImagem(img)}
              aria-label="Remover imagem"
              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setNovaImagem(e.target.files?.[0] ?? null)}
          className="flex-1"
        />
        <Button onClick={adicionarImagem} variant="outline" size="sm">
          Adicionar
        </Button>
      </div>

      {mensagem && <p className="text-sm text-gold">{mensagem}</p>}

      <Button onClick={salvar} disabled={salvando} className="mt-2 w-fit uppercase tracking-widest">
        {salvando ? "Salvando..." : "Salvar portfólio"}
      </Button>
    </div>
  );
}
