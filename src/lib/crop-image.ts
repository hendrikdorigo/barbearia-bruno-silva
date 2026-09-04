export type AreaPixels = { x: number; y: number; width: number; height: number };

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.crossOrigin = "anonymous";
    imagem.onload = () => resolve(imagem);
    imagem.onerror = reject;
    imagem.src = src;
  });
}

/** Recorta uma imagem (data/blob URL) na área selecionada e devolve um File JPEG pronto pra upload. */
export async function recortarImagem(
  imageSrc: string,
  area: AreaPixels,
  nomeArquivo: string
): Promise<File> {
  const imagem = await carregarImagem(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");

  ctx.drawImage(
    imagem,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))), "image/jpeg", 0.9);
  });

  const nomeBase = nomeArquivo.replace(/\.[^.]+$/, "");
  return new File([blob], `${nomeBase}.jpg`, { type: "image/jpeg" });
}
