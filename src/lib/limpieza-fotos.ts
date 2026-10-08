import { prisma } from "@/lib/prisma";

/** Días después de la entrega en los que el auto conserva todas sus fotos (por si se arma el posteo). */
export const DIAS_ANTES_DE_LIMPIAR = 30;

/**
 * Las fotos son lo que más ocupa en la base. Un auto entregado ya no aparece
 * en la web, así que pasado un tiempo se queda solo con la foto de portada.
 * La venta, el boleto y los recibos no se tocan.
 */
export async function limpiarFotosDeEntregados(dealershipId: string, hoy = new Date()) {
  const limite = new Date(hoy.getTime() - DIAS_ANTES_DE_LIMPIAR * 86_400_000);
  const autos = await prisma.vehicle.findMany({
    where: {
      dealershipId,
      sales: { some: { status: "ENTREGADA", deliveryDate: { lt: limite } } },
      photos: { some: { isCover: false } },
    },
    select: {
      id: true,
      photos: { select: { id: true, isCover: true }, orderBy: [{ isCover: "desc" }, { order: "asc" }] },
    },
  });

  let borradas = 0;
  for (const auto of autos) {
    const [portada, ...resto] = auto.photos;
    if (!portada || resto.length === 0) continue;
    const { count } = await prisma.vehiclePhoto.deleteMany({ where: { id: { in: resto.map((f) => f.id) } } });
    if (!portada.isCover) await prisma.vehiclePhoto.update({ where: { id: portada.id }, data: { isCover: true } });
    borradas += count;
  }

  if (borradas > 0) {
    await prisma.auditLog.create({
      data: {
        dealershipId,
        action: "photos.cleanup",
        entityType: "Dealership",
        entityId: dealershipId,
        metadata: { autos: autos.length, fotosBorradas: borradas, diasDespuesDeEntrega: DIAS_ANTES_DE_LIMPIAR },
      },
    });
  }
  return { autos: autos.length, borradas };
}
