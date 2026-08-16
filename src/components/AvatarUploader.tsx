"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CameraIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import ImageCropper from "@/components/ImageCropper";

export default function AvatarUploader({
  userId,
  avatarUrl,
  nome,
  syncClienteFoto = false,
}: {
  userId: string;
  avatarUrl: string | null;
  nome: string;
  syncClienteFoto?: boolean;
}) {
  const [url, setUrl] = useState(avatarUrl);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arquivoParaCortar, setArquivoParaCortar] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function trocarFoto(arquivo: File) {
    setEnviando(true);
    setErro(null);

    const path = `${userId}/${Date.now()}-${arquivo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arquivo, { upsert: true });
    if (uploadError) {
      setErro(uploadError.message);
      setEnviando(false);
      return;
    }
    const novaUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: novaUrl })
      .eq("id", userId);
    if (profileError) {
      setErro(profileError.message);
      setEnviando(false);
      return;
    }

    if (syncClienteFoto) {
      await supabase.from("clientes").update({ foto_url: novaUrl }).eq("profile_id", userId);
    }

    setUrl(novaUrl);
    setEnviando(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="group relative size-16 shrink-0">
        <span className="relative block size-16 overflow-hidden rounded-full border border-border bg-ink-soft">
          {url ? (
            <Image src={url} alt={nome} fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
              {nome.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          aria-label="Trocar foto de perfil"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/0 text-transparent transition-colors group-hover:bg-ink/60 group-hover:text-white disabled:pointer-events-none"
        >
          <CameraIcon className="size-5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) setArquivoParaCortar(arquivo);
            e.target.value = "";
          }}
        />
      </div>

      {arquivoParaCortar && (
        <ImageCropper
          file={arquivoParaCortar}
          aspecto={1}
          onCancel={() => setArquivoParaCortar(null)}
          onCrop={(recortado) => {
            setArquivoParaCortar(null);
            trocarFoto(recortado);
          }}
        />
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
        >
          {enviando ? "Enviando..." : "Trocar foto de perfil"}
        </Button>
        {erro && <p className="mt-1.5 text-sm text-destructive">{erro}</p>}
      </div>
    </div>
  );
}
