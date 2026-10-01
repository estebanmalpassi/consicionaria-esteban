import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const OPERACION_INCLUDE = {
  vehicle: true,
  buyer: true,
  seller: true,
  dealership: true,
  receipts: { orderBy: { number: "asc" } },
} satisfies Prisma.SaleInclude;

export type OperacionCompleta = Prisma.SaleGetPayload<{ include: typeof OPERACION_INCLUDE }>;

export function obtenerOperacion(id: string, dealershipId: string) {
  return prisma.sale.findFirst({ where: { id, dealershipId }, include: OPERACION_INCLUDE });
}

/** Totales de la operación: lo cobrado incluye recibos y el valor de la permuta. */
export function totalesOperacion(op: Pick<OperacionCompleta, "priceArs" | "tradeInValueArs" | "receipts">) {
  const precio = Number(op.priceArs);
  const permuta = Number(op.tradeInValueArs ?? 0);
  const cobrado = op.receipts.reduce((acc, r) => acc + Number(r.amountArs), 0);
  const saldo = Math.max(precio - permuta - cobrado, 0);
  return { precio, permuta, cobrado, saldo };
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function fechaCorta(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fechaLarga(d: Date | string) {
  const f = new Date(d);
  return `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
}

/** "a los 30 días del mes de septiembre de 2026" ("al primer día…" el día 1) */
export function fechaContrato(d: Date | string) {
  const f = new Date(d);
  const dia = f.getDate() === 1 ? "al primer día" : `a los ${f.getDate()} días`;
  return `${dia} del mes de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
}
