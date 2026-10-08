"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDealerOrNull } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/vehiculos";

const apartadoSchema = z.object({
  nombre: z.string().trim().min(2, "Poné el nombre de quien lo aparta.").max(80),
  telefono: z.string().trim().max(40).optional(),
  nota: z.string().trim().max(160).optional(),
});

async function autoPropio(vehicleId: string) {
  const ctx = await getDealerOrNull();
  if (!ctx) return null;
  const auto = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: ctx.dealership.id },
    select: { id: true, status: true, sales: { where: { status: { not: "ANULADA" } }, select: { id: true }, take: 1 } },
  });
  return auto ? { ctx, auto } : null;
}

/**
 * Aparta un auto sin seña ("guardámelo hasta mañana"): pasa a reservado y deja
 * de verse en la web. No genera papeles. Quién lo apartó queda en la auditoría.
 */
export async function apartarVehiculoAction(vehicleId: string, raw: z.input<typeof apartadoSchema>): Promise<ActionResult> {
  const found = await autoPropio(vehicleId);
  if (!found) return { ok: false, error: "No encontramos ese auto." };
  if (found.auto.sales.length || found.auto.status === "SOLD") return { ok: false, error: "Este auto ya tiene una operación." };
  const parsed = apartadoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const a = parsed.data;

  await prisma.$transaction([
    prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "PAUSED" } }),
    prisma.auditLog.create({
      data: {
        actorUserId: found.ctx.user.id,
        dealershipId: found.ctx.dealership.id,
        action: "vehicle.apartado",
        entityType: "Vehicle",
        entityId: vehicleId,
        metadata: { nombre: a.nombre, telefono: a.telefono || null, nota: a.nota || null },
      },
    }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Libera un auto apartado: vuelve a estar disponible y a verse en la web. */
export async function liberarVehiculoAction(vehicleId: string): Promise<ActionResult> {
  const found = await autoPropio(vehicleId);
  if (!found) return { ok: false, error: "No encontramos ese auto." };
  if (found.auto.status !== "PAUSED") return { ok: false, error: "Este auto no está apartado." };
  await prisma.$transaction([
    prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "DRAFT" } }),
    prisma.auditLog.create({
      data: {
        actorUserId: found.ctx.user.id,
        dealershipId: found.ctx.dealership.id,
        action: "vehicle.liberado",
        entityType: "Vehicle",
        entityId: vehicleId,
      },
    }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}
