/**
 * Achica y comprime una foto en el navegador antes de subirla (una foto de
 * celular de 5 MB queda en ~250 KB). Así entran muchas fotos en una base de
 * datos gratuita y la subida es rápida aun con datos móviles.
 */
export async function comprimirImagen(file: File, maxLado = 1600, calidad = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  const fuente: CanvasImageSource & { width: number; height: number } =
    bitmap ?? (await cargarImagen(file));

  const escala = Math.min(1, maxLado / Math.max(fuente.width, fuente.height));
  const w = Math.round(fuente.width * escala);
  const h = Math.round(fuente.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(fuente, 0, 0, w, h);
  bitmap?.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
  return blob ?? file;
}

function cargarImagen(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function subirFoto(vehicleId: string, file: File, label?: string) {
  const blob = await comprimirImagen(file);
  const form = new FormData();
  form.append("file", blob, "foto.jpg");
  if (label) form.append("label", label);
  const res = await fetch(`/api/vehiculos/${vehicleId}/fotos`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "No se pudo subir la foto");
  }
  return (await res.json()) as { id: string };
}
