"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dealershipOnboardingSchema,
  type DealershipOnboardingValues,
} from "@/lib/validations/dealership";

export interface OnboardingActionResult {
  ok: boolean;
  error?: string;
}

export async function submitOnboardingAction(
  raw: DealershipOnboardingValues
): Promise<OnboardingActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "DEALER_OWNER") {
    return { ok: false, error: "Necesitás una cuenta de concesionaria para continuar." };
  }

  const parsed = dealershipOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const values = parsed.data;

  const cuitTaken = await prisma.dealership.findFirst({
    where: { cuit: values.cuit, ownerId: { not: session.user.id } },
  });
  if (cuitTaken) {
    return { ok: false, error: "Ese CUIT ya está registrado por otra cuenta." };
  }

  await prisma.$transaction(async (tx) => {
    const dealership = await tx.dealership.upsert({
      where: { ownerId: session.user.id },
      create: {
        ownerId: session.user.id,
        legalName: values.legalName,
        tradeName: values.tradeName,
        cuit: values.cuit,
        afipConditionIva: values.afipConditionIva,
        afipCredentialId: values.afipCredentialId,
        addressStreet: values.addressStreet,
        addressCity: values.addressCity,
        province: values.province,
        postalCode: values.postalCode,
        phone: values.phone,
        website: values.website || null,
        status: "DOCS_SUBMITTED",
      },
      update: {
        legalName: values.legalName,
        tradeName: values.tradeName,
        cuit: values.cuit,
        afipConditionIva: values.afipConditionIva,
        afipCredentialId: values.afipCredentialId,
        addressStreet: values.addressStreet,
        addressCity: values.addressCity,
        province: values.province,
        postalCode: values.postalCode,
        phone: values.phone,
        website: values.website || null,
        status: "DOCS_SUBMITTED",
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { dealershipId: dealership.id },
    });

    const documents: { type: "CUIT_CONSTANCIA" | "LEGAL_ID" | "BUSINESS_LICENSE"; fileUrl: string }[] = [
      { type: "CUIT_CONSTANCIA", fileUrl: values.cuitConstanciaUrl },
      { type: "LEGAL_ID", fileUrl: values.legalIdUrl },
    ];
    if (values.businessLicenseUrl) {
      documents.push({ type: "BUSINESS_LICENSE", fileUrl: values.businessLicenseUrl });
    }

    for (const doc of documents) {
      const existing = await tx.dealershipDocument.findFirst({
        where: { dealershipId: dealership.id, type: doc.type },
      });
      if (existing) {
        await tx.dealershipDocument.update({
          where: { id: existing.id },
          data: { fileUrl: doc.fileUrl, status: "PENDING" },
        });
      } else {
        await tx.dealershipDocument.create({
          data: { dealershipId: dealership.id, type: doc.type, fileUrl: doc.fileUrl },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        dealershipId: dealership.id,
        action: "dealership.docs_submitted",
        entityType: "Dealership",
        entityId: dealership.id,
      },
    });
  });

  revalidatePath("/dealer");
  return { ok: true };
}

export async function getOwnDealership(userId: string) {
  return prisma.dealership.findUnique({
    where: { ownerId: userId },
    include: { documents: true },
  });
}
