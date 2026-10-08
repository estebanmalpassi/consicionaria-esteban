"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDealerOrNull } from "@/lib/dealer";
import { CATEGORIAS_GASTO } from "@/lib/gastos";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/vehiculos";

const gastoSchema = z.object({
  vehicleId: z.string().min(1),
  category: z.enum(CATEGORIAS_GASTO, { message: "Elegí el tipo de gasto." }),
  description: z.string().trim().max(120).optional(),
  amount: z.coerce.number({ message: "Poné el monto." }).positive("El monto tiene que ser mayor a cero.").max(1e12),
});

/** Suma un gasto a un auto de la agencia. */
export async function agregarGastoAction(raw: z.input<typeof gastoSchema>): Promise<ActionResult> {
  const ctx = await getDealerOrNull();
  if (!ctx) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };
  const parsed = gastoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const g = parsed.data;

  const auto = await prisma.vehicle.findFirst({ where: { id: g.vehicleId, dealershipId: ctx.dealership.id }, select: { id: true } });
  if (!auto) return { ok: false, error: "No encontramos ese auto." };

  await prisma.vehicleExpense.create({
    data: { vehicleId: auto.id, category: g.category, description: g.description || null, amountArs: g.amount },
  });
  revalidatePath("/dealer", "layout");
  return { ok: true };
}

/** Borra un gasto cargado por error. */
export async function borrarGastoAction(gastoId: string): Promise<ActionResult> {
  const ctx = await getDealerOrNull();
  if (!ctx) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };
  const gasto = await prisma.vehicleExpense.findFirst({
    where: { id: gastoId, vehicle: { dealershipId: ctx.dealership.id } },
    select: { id: true },
  });
  if (!gasto) return { ok: false, error: "No encontramos ese gasto." };
  await prisma.vehicleExpense.delete({ where: { id: gasto.id } });
  revalidatePath("/dealer", "layout");
  return { ok: true };
}
