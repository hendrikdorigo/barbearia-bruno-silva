"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { ZoomInIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { recortarImagem } from "@/lib/crop-image";

/**
 * Ajuste de enquadramento antes de subir a foto (arrastar/dar zoom pra
 * escolher o que fica visível) - mesmo diálogo reaproveitado pra fotos de
 * serviço e de produto, só muda o aspect ratio e o nome do arquivo final.
 */
export default function ImageCropDialog({
  open,
  imageSrc,
  nomeArquivo,
  aspect = 1,
  salvando = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageSrc: string | null;
  nomeArquivo: string;
  aspect?: number;
  salvando?: boolean;
  onCancel: () => void;
  onConfirm: (arquivo: File) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);

  const aoCompletarCrop = useCallback((_area: Area, areaEmPixels: Area) => {
    setAreaPixels(areaEmPixels);
  }, []);

  async function confirmar() {
    if (!imageSrc || !areaPixels) return;
    const arquivo = await recortarImagem(imageSrc, areaPixels, nomeArquivo);
    onConfirm(arquivo);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-ink">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={aoCompletarCrop}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomInIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-gold"
            aria-label="Zoom"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar} disabled={salvando || !areaPixels}>
            {salvando ? "Salvando..." : "Usar essa foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
