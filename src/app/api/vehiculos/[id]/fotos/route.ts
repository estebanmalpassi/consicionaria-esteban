import { revalidatePath } from "next/cache";

import { getDealerOrNull } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 1.5 * 1024 * 1024; // las fotos llegan ya comprimidas desde el navegador
const MAX_FOTOS = 20;

/** Sube una foto (multipart: file + label). Se guarda en la base para no depender de un storage pago. */
export async function POST(request: Request, ctx: RouteContext<"/api/vehiculos/[id]/fotos">) {
  const { id } = await ctx.params;
  const dealer = await getDealerOrNull();
  if (!dealer) return Response.json({ error: "No autorizado" }, { status: 401 });

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealer.dealership.id },
    include: { _count: { select: { photos: true } } },
  });
  if (!vehicle) return Response.json({ error: "Vehículo no encontrado" }, { status: 404 });
  if (vehicle._count.photos >= MAX_FOTOS) {
    return Response.json({ error: `Máximo ${MAX_FOTOS} fotos por vehículo` }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const label = form.get("label");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return Response.json({ error: "Archivo inválido" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: "La foto es demasiado pesada" }, { status: 413 });

  const photo = await prisma.vehiclePhoto.create({
    data: {
      vehicleId: id,
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      label: typeof label === "string" && label ? label.slice(0, 40) : null,
      order: vehicle._count.photos,
      isCover: vehicle._count.photos === 0,
    },
    select: { id: true },
  });

  revalidatePath("/dealer", "layout");
  return Response.json({ id: photo.id });
}
