"use server";

import { revalidatePath } from "next/cache";

import { getDealerOrNull } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import { nn, vehiculoSchema, type VehiculoValues } from "@/lib/validations/operacion";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  /** Campo que falló la validación (ej. "buyer.docNumber"), para resaltarlo en el formulario. */
  field?: string;
  data?: T;
}

export async function guardarVehiculoAction(
  raw: VehiculoValues,
  vehicleId?: string
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getDealerOrNull();
  if (!ctx) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsed = vehiculoSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos.", field: issue?.path.join(".") };
  }
  const v = parsed.data;

  const existente = await prisma.vehicle.findUnique({ where: { patente: v.patente } });
  if (existente && existente.id !== vehicleId) {
    if (existente.dealershipId !== ctx.dealership.id) {
      return { ok: false, error: "Esa patente ya está cargada por otra concesionaria." };
    }
    return { ok: false, error: `La patente ${v.patente} ya está en tu stock.` };
  }

  const data = {
    patente: v.patente,
    brand: v.brand,
    model: v.model,
    version: nn(v.version),
    year: v.year,
    mileageKm: v.mileageKm,
    bodyType: nn(v.bodyType),
    color: nn(v.color),
    engineNumber: nn(v.engineNumber),
    vin: nn(v.vin),
    fuelType: v.fuelType,
    transmission: v.transmission,
    priceArs: v.priceArs,
    // Los empleados no ven el costo: si guardan, no se toca el que cargó el dueño.
    ...(ctx.esDueno && { purchasePriceArs: v.purchasePriceArs || null }),
    description: nn(v.description),
    city: ctx.dealership.addressCity,
    province: ctx.dealership.province,
  };

  let id = vehicleId;
  if (vehicleId) {
    const own = await prisma.vehicle.findFirst({ where: { id: vehicleId, dealershipId: ctx.dealership.id } });
    if (!own) return { ok: false, error: "No encontramos ese vehículo." };
    await prisma.vehicle.update({ where: { id: vehicleId }, data });
  } else {
    const creado = await prisma.vehicle.create({ data: { ...data, dealershipId: ctx.dealership.id } });
    id = creado.id;
    await prisma.auditLog.create({
      data: {
        actorUserId: ctx.user.id,
        dealershipId: ctx.dealership.id,
        action: "vehicle.created",
        entityType: "Vehicle",
        entityId: creado.id,
      },
    });
  }

  revalidatePath("/dealer", "layout");
  return { ok: true, data: { id: id! } };
}

async function fotoPropia(photoId: string) {
  const ctx = await getDealerOrNull();
  if (!ctx) return null;
  return prisma.vehiclePhoto.findFirst({
    where: { id: photoId, vehicle: { dealershipId: ctx.dealership.id } },
    select: { id: true, vehicleId: true, isCover: true },
  });
}

export async function borrarFotoAction(photoId: string): Promise<ActionResult> {
  const foto = await fotoPropia(photoId);
  if (!foto) return { ok: false, error: "No encontramos esa foto." };
  await prisma.vehiclePhoto.delete({ where: { id: photoId } });
  if (foto.isCover) {
    const siguiente = await prisma.vehiclePhoto.findFirst({
      where: { vehicleId: foto.vehicleId },
      orderBy: { order: "asc" },
    });
    if (siguiente) await prisma.vehiclePhoto.update({ where: { id: siguiente.id }, data: { isCover: true } });
  }
  revalidatePath("/dealer", "layout");
  return { ok: true };
}

export async function marcarPortadaAction(photoId: string): Promise<ActionResult> {
  const foto = await fotoPropia(photoId);
  if (!foto) return { ok: false, error: "No encontramos esa foto." };
  await prisma.$transaction([
    prisma.vehiclePhoto.updateMany({ where: { vehicleId: foto.vehicleId }, data: { isCover: false } }),
    prisma.vehiclePhoto.update({ where: { id: photoId }, data: { isCover: true } }),
  ]);
  revalidatePath("/dealer", "layout");
  return { ok: true };
}

export async function borrarVehiculoAction(vehicleId: string): Promise<ActionResult> {
  const ctx = await getDealerOrNull();
  if (!ctx) return { ok: false, error: "Tu sesión expiró." };
  const v = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: ctx.dealership.id },
    include: { sales: { select: { id: true, status: true } } },
  });
  if (!v) return { ok: false, error: "No encontramos ese vehículo." };
  // Una venta activa protege al auto; las anuladas (por ejemplo, de prueba) se
  // borran junto con él, con sus recibos.
  if (v.sales.some((s) => s.status !== "ANULADA")) {
    return { ok: false, error: "Este auto tiene una venta activa. Primero anulá la operación." };
  }
  await prisma.$transaction([
    prisma.sale.deleteMany({ where: { vehicleId, status: "ANULADA" } }),
    prisma.vehicle.delete({ where: { id: vehicleId } }),
    prisma.auditLog.create({
      data: {
        actorUserId: ctx.user.id,
        dealershipId: ctx.dealership.id,
        action: "vehicle.deleted",
        entityType: "Vehicle",
        entityId: vehicleId,
        metadata: { patente: v.patente, ventasAnuladasBorradas: v.sales.length },
      },
    }),
  ]);
  revalidatePath("/dealer", "layout");
  return { ok: true };
}
