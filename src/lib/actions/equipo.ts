"use server";

import { revalidatePath } from "next/cache";

import { getDealerOrNull } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/vehiculos";

/** El dueño le quita el acceso al panel a un empleado (la cuenta queda sin permisos). */
export async function quitarAccesoAction(userId: string): Promise<ActionResult> {
  const ctx = await getDealerOrNull();
  if (!ctx || !ctx.esDueno) return { ok: false, error: "Solo el dueño de la agencia puede quitar accesos." };
  if (userId === ctx.user.id) return { ok: false, error: "No podés quitarte el acceso a vos mismo." };

  const empleado = await prisma.user.findFirst({
    where: { id: userId, dealershipId: ctx.dealership.id, role: "DEALER_STAFF" },
  });
  if (!empleado) return { ok: false, error: "No encontramos a esa persona en el equipo." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: "BUYER", dealershipId: null } }),
    prisma.auditLog.create({
      data: {
        actorUserId: ctx.user.id,
        dealershipId: ctx.dealership.id,
        action: "user.access_revoked",
        entityType: "User",
        entityId: userId,
      },
    }),
  ]);

  revalidatePath("/dealer/ajustes");
  return { ok: true };
}

/**
 * El dueño le pasa la propiedad de la agencia a alguien del equipo (por ejemplo,
 * el desarrollador que la configuró se la pasa al dueño real). El dueño anterior
 * queda como empleado.
 */
export async function hacerDuenoAction(userId: string): Promise<ActionResult> {
  const ctx = await getDealerOrNull();
  if (!ctx || !ctx.esDueno) return { ok: false, error: "Solo el dueño de la agencia puede pasar la propiedad." };
  if (userId === ctx.user.id) return { ok: false, error: "Ya sos el dueño." };

  const nuevo = await prisma.user.findFirst({
    where: { id: userId, dealershipId: ctx.dealership.id, role: "DEALER_STAFF" },
  });
  if (!nuevo) return { ok: false, error: "Esa persona no es parte del equipo." };

  await prisma.$transaction([
    prisma.dealership.update({ where: { id: ctx.dealership.id }, data: { ownerId: userId } }),
    prisma.user.update({ where: { id: userId }, data: { role: "DEALER_OWNER", dealershipId: ctx.dealership.id } }),
    prisma.user.update({ where: { id: ctx.user.id }, data: { role: "DEALER_STAFF", dealershipId: ctx.dealership.id } }),
    prisma.auditLog.create({
      data: {
        actorUserId: ctx.user.id,
        dealershipId: ctx.dealership.id,
        action: "dealership.owner_changed",
        entityType: "User",
        entityId: userId,
      },
    }),
  ]);

  revalidatePath("/dealer", "layout");
  return { ok: true };
}
