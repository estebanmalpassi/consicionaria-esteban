"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { getAgencia } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import {
  dealershipOnboardingSchema,
  type DealershipOnboardingValues,
} from "@/lib/validations/dealership";

export interface OnboardingActionResult {
  ok: boolean;
  error?: string;
}

/** Crea o actualiza los datos de la concesionaria que salen en el boleto y los recibos. */
export async function submitOnboardingAction(
  raw: DealershipOnboardingValues
): Promise<OnboardingActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER_OWNER") {
    return { ok: false, error: "Necesitás una cuenta de concesionaria para continuar." };
  }

  // Solo el dueño de la agencia edita sus datos; nadie puede crear otra concesionaria.
  const agencia = await getAgencia();
  if (agencia && agencia.ownerId !== session.user.id) {
    return { ok: false, error: "Solo el dueño de la agencia puede cambiar estos datos." };
  }

  const parsed = dealershipOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const values = { ...parsed.data, cuit: parsed.data.cuit.replace(/\D/g, "") };

  const cuitTaken = await prisma.dealership.findFirst({
    where: { cuit: values.cuit, ownerId: { not: session.user.id } },
  });
  if (cuitTaken) {
    return { ok: false, error: "Ese CUIT ya está registrado por otra cuenta." };
  }

  const data = {
    legalName: values.legalName,
    tradeName: values.tradeName,
    cuit: values.cuit,
    afipConditionIva: values.afipConditionIva,
    addressStreet: values.addressStreet,
    addressCity: values.addressCity,
    province: values.province,
    postalCode: values.postalCode,
    phone: values.phone,
  };

  await prisma.$transaction(async (tx) => {
    const dealership = await tx.dealership.upsert({
      where: { ownerId: session.user.id },
      create: { ownerId: session.user.id, ...data },
      update: data,
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { dealershipId: dealership.id },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        dealershipId: dealership.id,
        action: "dealership.updated",
        entityType: "Dealership",
        entityId: dealership.id,
      },
    });
  });

  revalidatePath("/dealer", "layout");
  return { ok: true };
}

export async function getOwnDealership(userId: string) {
  return prisma.dealership.findUnique({ where: { ownerId: userId } });
}
