"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AvatarUploader from "@/components/AvatarUploader";
import { cn } from "@/lib/utils";

const BIO_LIMITE = 280;

type ItemPortfolio = { url: string; legenda: string };

export default function PortfolioEditor({
  barbeiro,
  profile,
  itensPortfolioIniciais,
}: {
  barbeiro: any;
  profile: { nome: string; avatar_url: string | null };
  itensPortfolioIniciais: { url: string; legenda: string | null }[];
}) {
  const [bio, setBio] = useState(barbeiro.bio ?? "");
  const [especialidades, setEspecialidades] = useState<string>(
    ((barbeiro.especialidades ?? []) as string[]).join(", ")
  );
  const [itens, setItens] = useState<ItemPortfolio[]>(
    itensPortfolioIniciais.map((i) => ({ url: i.url, legenda: i.legenda ?? "" }))
  );
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
    setItens((prev) => [...prev, { url, legenda: "" }]);
    setNovaImagem(null);
  }

  function removerImagem(url: string) {
    setItens((prev) => prev.filter((i) => i.url !== url));
  }

  function atualizarLegenda(url: string, legenda: string) {
    setItens((prev) => prev.map((i) => (i.url === url ? { ...i, legenda } : i)));
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);

    const { error: barbeiroError } = await supabase
      .from("barbeiros")
      .update({
        bio,
        especialidades: especialidades
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        banner_url: bannerUrl,
      })
      .eq("profile_id", barbeiro.profile_id);
    if (barbeiroError) {
      setMensagem(barbeiroError.message);
      setSalvando(false);
      return;
    }

    await supabase.from("portfolio_itens").delete().eq("barbeiro_id", barbeiro.profile_id);
    if (itens.length > 0) {
      const { error: itensError } = await supabase.from("portfolio_itens").insert(
        itens.map((item, index) => ({
          barbeiro_id: barbeiro.profile_id,
          url: item.url,
          legenda: item.legenda.trim() || null,
          ordem: index,
        }))
      );
      if (itensError) {
        setMensagem(itensError.message);
        setSalvando(false);
        return;
      }
    }

    setSalvando(false);
    setMensagem("Portfólio atualizado!");
    router.refresh();
  }

  const bioRestante = BIO_LIMITE - bio.length;

  return (
    <div className="mt-8 flex flex-col gap-4">
      <label className="text-xs uppercase tracking-widest text-muted-foreground">
        Foto de perfil
      </label>
      <AvatarUploader userId={barbeiro.profile_id} avatarUrl={profile.avatar_url} nome={profile.nome} />

      <label className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
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

      <div className="mt-4 flex items-baseline justify-between">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Descrição / bio
        </label>
        <span
          className={cn(
            "font-mono text-xs",
            bioRestante < 0 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {bio.length}/{BIO_LIMITE}
        </span>
      </div>
      <Textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        className="bg-ink-soft"
        placeholder="Conte em poucas frases quem você é e seu diferencial como barbeiro."
      />
      {bioRestante < 0 && (
        <p className="text-xs text-muted-foreground">
          Sua bio está {Math.abs(bioRestante)} caracteres acima do recomendado —
          considere resumir para um visual mais limpo na sua página.
        </p>
      )}

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {itens.map((item) => (
          <div key={item.url} className="flex flex-col gap-1.5">
            <div className="relative">
              <img src={item.url} alt="" className="h-24 w-full rounded-lg object-cover" />
              <button
                onClick={() => removerImagem(item.url)}
                aria-label="Remover imagem"
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <XIcon className="size-3" />
              </button>
            </div>
            <Input
              value={item.legenda}
              onChange={(e) => atualizarLegenda(item.url, e.target.value)}
              placeholder="Legenda (opcional)"
              className="h-7 bg-ink-soft text-xs"
            />
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
