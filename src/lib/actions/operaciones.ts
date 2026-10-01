"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { getDealerOrNull } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import {
  entregaSchema,
  nn,
  operacionSchema,
  reciboSchema,
  type OperacionValues,
  type PersonaValues,
  type ReciboValues,
} from "@/lib/validations/operacion";
import { personaSchema } from "@/lib/validations/operacion";
import type { ActionResult } from "@/lib/actions/vehiculos";
import type { z } from "zod";

type Persona = z.output<typeof personaSchema>;

function datosPersona(p: Persona) {
  return {
    fullName: p.fullName,
    docType: p.docType,
    ivaCondition: p.ivaCondition,
    nationality: nn(p.nationality),
    maritalStatus: nn(p.maritalStatus),
    birthDate: nn(p.birthDate),
    occupation: nn(p.occupation),
    address: nn(p.address),
    city: nn(p.city),
    province: nn(p.province),
    postalCode: nn(p.postalCode),
    phone: nn(p.phone),
    email: nn(p.email),
  };
}

function upsertPersona(tx: Prisma.TransactionClient, dealershipId: string, p: Persona) {
  return tx.customer.upsert({
    where: { dealershipId_docNumber: { dealershipId, docNumber: p.docNumber } },
    create: { dealershipId, docNumber: p.docNumber, ...datosPersona(p) },
    update: datosPersona(p),
  });
}

async function siguienteNumeroRecibo(tx: Prisma.TransactionClient, dealershipId: string) {
  const ultimo = await tx.receipt.aggregate({ where: { sale: { dealershipId } }, _max: { number: true } });
  return (ultimo._max.number ?? 0) + 1;
}

/** Fecha "YYYY-MM-DD" del formulario → mediodía local, para que no se corra de día por el huso. */
function fecha(valor: string) {
  return new Date(`${valor}T12:00:00`);
}

export async function crearOperacionAction(raw: OperacionValues): Promise<ActionResult<{ id: string }>> {
  const ctx = await getDealerOrNull();
  if (!ctx) return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };

  const parsed = operacionSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Datos inválidos.", field: issue?.path.join(".") };
  }
  const v = parsed.data;
  if (!v.sellerIsDealership && !v.seller) return { ok: false, error: "Faltan los datos del vendedor." };
  if (v.depositArs && v.depositArs > v.priceArs) return { ok: false, error: "La seña no puede superar el precio." };

  const vehiculo = await prisma.vehicle.findFirst({ where: { id: v.vehicleId, dealershipId: ctx.dealership.id } });
  if (!vehiculo) return { ok: false, error: "No encontramos ese auto en tu stock." };

  const dealershipId = ctx.dealership.id;
  const sena = v.depositArs ?? 0;
  const pagoTotal = sena >= v.priceArs;

  const venta = await prisma.$transaction(async (tx) => {
    const buyer = await upsertPersona(tx, dealershipId, v.buyer);
    const seller = !v.sellerIsDealership && v.seller ? await upsertPersona(tx, dealershipId, v.seller) : null;

    const ultima = await tx.sale.aggregate({ where: { dealershipId }, _max: { number: true } });
    const checklist: Record<string, boolean> = {};
    if (sena > 0) checklist.sena = true;
    if (pagoTotal) checklist.pago = true;

    const sale = await tx.sale.create({
      data: {
        dealershipId,
        number: (ultima._max.number ?? 0) + 1,
        vehicleId: vehiculo.id,
        buyerId: buyer.id,
        sellerId: seller?.id ?? null,
        status: sena > 0 && !pagoTotal ? "RESERVADA" : "VENDIDA",
        saleDate: fecha(v.saleDate),
        priceArs: v.priceArs,
        depositArs: sena,
        paymentMethod: v.paymentMethod,
        paymentNotes: nn(v.paymentNotes),
        tradeInDescription: nn(v.tradeInDescription),
        tradeInPatente: nn(v.tradeInPatente)?.toUpperCase() ?? null,
        tradeInValueArs: v.tradeInValueArs || null,
        transferCostsBy: v.transferCostsBy,
        transferDays: v.transferDays,
        checklist,
        notes: nn(v.notes),
        createdById: ctx.user.id,
      },
    });

    if (sena > 0) {
      await tx.receipt.create({
        data: {
          saleId: sale.id,
          number: await siguienteNumeroRecibo(tx, dealershipId),
          date: fecha(v.saleDate),
          amountArs: sena,
          concept: pagoTotal ? "Pago total del vehículo" : "Seña / reserva del vehículo",
          method: v.paymentMethod,
        },
      });
    }

    await tx.vehicle.update({ where: { id: vehiculo.id }, data: { status: "SOLD", priceArs: v.priceArs } });
    await tx.auditLog.create({
      data: { actorUserId: ctx.user.id, dealershipId, action: "sale.created", entityType: "Sale", entityId: sale.id },
    });
    return sale;
  });

  revalidatePath("/dealer", "layout");
  return { ok: true, data: { id: venta.id } };
}

async function ventaPropia(saleId: string) {
  const ctx = await getDealerOrNull();
  if (!ctx) return null;
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, dealershipId: ctx.dealership.id },
    include: { receipts: true },
  });
  return sale ? { ctx, sale } : null;
}

export async function agregarReciboAction(raw: ReciboValues): Promise<ActionResult<{ id: string }>> {
  const parsed = reciboSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const v = parsed.data;
  const found = await ventaPropia(v.saleId);
  if (!found) return { ok: false, error: "No encontramos la operación." };
  const { ctx, sale } = found;

  const recibo = await prisma.$transaction(async (tx) => {
    const r = await tx.receipt.create({
      data: {
        saleId: sale.id,
        number: await siguienteNumeroRecibo(tx, ctx.dealership.id),
        date: fecha(v.date),
        amountArs: v.amountArs,
        concept: v.concept,
        method: v.method,
        notes: nn(v.notes),
      },
    });
    const cobrado = sale.receipts.reduce((acc, x) => acc + Number(x.amountArs), 0) + v.amountArs;
    const tradeIn = Number(sale.tradeInValueArs ?? 0);
    const checklist = { ...((sale.checklist as Record<string, boolean>) ?? {}) };
    if (/se[ñn]a/i.test(v.concept)) checklist.sena = true;
    const pagado = cobrado + tradeIn >= Number(sale.priceArs);
    if (pagado) checklist.pago = true;
    await tx.sale.update({
      where: { id: sale.id },
      data: { checklist, status: pagado && sale.status === "RESERVADA" ? "VENDIDA" : undefined },
    });
    return r;
  });

  revalidatePath(`/dealer/operaciones/${sale.id}`);
  return { ok: true, data: { id: recibo.id } };
}

export async function toggleTramiteAction(saleId: string, paso: string, hecho: boolean): Promise<ActionResult> {
  const found = await ventaPropia(saleId);
  if (!found) return { ok: false, error: "No encontramos la operación." };
  const checklist = { ...((found.sale.checklist as Record<string, boolean>) ?? {}), [paso]: hecho };
  await prisma.sale.update({ where: { id: saleId }, data: { checklist } });
  revalidatePath(`/dealer/operaciones/${saleId}`);
  return { ok: true };
}

export async function registrarEntregaAction(raw: z.input<typeof entregaSchema>): Promise<ActionResult> {
  const parsed = entregaSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const v = parsed.data;
  const found = await ventaPropia(v.saleId);
  if (!found) return { ok: false, error: "No encontramos la operación." };
  await prisma.sale.update({
    where: { id: v.saleId },
    data: {
      deliveryDate: fecha(v.deliveryDate),
      deliveryKm: v.deliveryKm,
      status: "ENTREGADA",
      checklist: { ...((found.sale.checklist as Record<string, boolean>) ?? {}), entrega: true },
    },
  });
  revalidatePath("/dealer", "layout");
  return { ok: true };
}

export async function anularOperacionAction(saleId: string): Promise<ActionResult> {
  const found = await ventaPropia(saleId);
  if (!found) return { ok: false, error: "No encontramos la operación." };
  await prisma.$transaction([
    prisma.sale.update({ where: { id: saleId }, data: { status: "ANULADA" } }),
    prisma.vehicle.update({ where: { id: found.sale.vehicleId }, data: { status: "DRAFT" } }),
    prisma.auditLog.create({
      data: {
        actorUserId: found.ctx.user.id,
        dealershipId: found.ctx.dealership.id,
        action: "sale.canceled",
        entityType: "Sale",
        entityId: saleId,
      },
    }),
  ]);
  revalidatePath("/dealer", "layout");
  return { ok: true };
}

/** Autocompletar: busca una persona ya cargada por DNI/CUIT. */
export async function buscarPersonaAction(docNumber: string): Promise<PersonaValues | null> {
  const ctx = await getDealerOrNull();
  if (!ctx) return null;
  const clean = docNumber.replace(/[.\s-]/g, "");
  if (clean.length < 6) return null;
  const p = await prisma.customer.findUnique({
    where: { dealershipId_docNumber: { dealershipId: ctx.dealership.id, docNumber: clean } },
  });
  if (!p) return null;
  return {
    fullName: p.fullName,
    docType: p.docType as PersonaValues["docType"],
    docNumber: p.docNumber,
    ivaCondition: p.ivaCondition,
    nationality: p.nationality ?? "",
    maritalStatus: p.maritalStatus ?? "",
    birthDate: p.birthDate ?? "",
    occupation: p.occupation ?? "",
    address: p.address ?? "",
    city: p.city ?? "",
    province: p.province ?? "",
    postalCode: p.postalCode ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
  };
}
