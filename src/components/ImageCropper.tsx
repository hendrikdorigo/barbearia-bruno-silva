"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CROP_SIZE = 320;
const OUTPUT_SIZE = 1080;

type Offset = { x: number; y: number };

/**
 * Corte estilo Instagram: arrasta para posicionar, slider para dar zoom.
 * Recorta sempre um quadrado (1:1) - suficiente para os posts da comunidade.
 */
export default function ImageCropper({
  file,
  onCancel,
  onCrop,
}: {
  file: File;
  onCancel: () => void;
  onCrop: (arquivo: File) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const draggingRef = useRef<{ pointerId: number; startX: number; startY: number; startOffset: Offset } | null>(
    null
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      const ms = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setMinScale(ms);
      setScale(ms);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clampOffset(next: Offset, s: number): Offset {
    if (!natural) return next;
    const maxX = Math.max(0, (natural.w * s - CROP_SIZE) / 2);
    const maxY = Math.max(0, (natural.h * s - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startOffset: offset };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = draggingRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const next = { x: d.startOffset.x + (e.clientX - d.startX), y: d.startOffset.y + (e.clientY - d.startY) };
    setOffset(clampOffset(next, scale));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (draggingRef.current?.pointerId === e.pointerId) draggingRef.current = null;
  }

  function onZoom(novoScale: number) {
    setScale(novoScale);
    setOffset((prev) => clampOffset(prev, novoScale));
  }

  function confirmar() {
    if (!natural || !imgRef.current) return;
    const imgLeft = CROP_SIZE / 2 - (natural.w * scale) / 2 + offset.x;
    const imgTop = CROP_SIZE / 2 - (natural.h * scale) / 2 + offset.y;
    const srcX = (0 - imgLeft) / scale;
    const srcY = (0 - imgTop) / scale;
    const srcSize = CROP_SIZE / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCrop(new File([blob], file.name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar imagem</DialogTitle>
          <DialogDescription>Arraste para posicionar e use o controle para dar zoom.</DialogDescription>
        </DialogHeader>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-lg border border-border bg-black"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {imgUrl && natural && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: natural.w * scale,
                height: natural.h * scale,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
        </div>

        {natural && (
          <input
            type="range"
            min={minScale}
            max={minScale * 3}
            step={(minScale * 3 - minScale) / 100 || 0.01}
            value={scale}
            onChange={(e) => onZoom(Number(e.target.value))}
            className="mt-3 w-full accent-gold"
            aria-label="Zoom"
          />
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <XIcon data-icon="inline-start" />
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar}>
            <CheckIcon data-icon="inline-start" />
            Aplicar corte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
