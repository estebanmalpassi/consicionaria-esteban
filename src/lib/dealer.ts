import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * La app es de una sola agencia (Cartuccia). La agencia es la concesionaria
 * con el CUIT de `CUIT_AGENCIA` si está configurado; si no, la primera que se
 * registró. Cualquier otra cuenta no tiene acceso al panel.
 */
export async function getAgencia() {
  const cuit = process.env.CUIT_AGENCIA?.replace(/\D/g, "");
  if (cuit) return prisma.dealership.findUnique({ where: { cuit } });
  return prisma.dealership.findFirst({ orderBy: { createdAt: "asc" } });
}

/** Compara un código sin filtrar información por el tiempo de respuesta. */
function coincide(codigo: string, esperado: string | undefined) {
  const e = esperado?.trim();
  if (!e) return false;
  const a = Buffer.from(codigo.trim());
  const b = Buffer.from(e);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Código para que el equipo se registre como empleados. */
export function codigoInvitacionValido(codigo: string) {
  return coincide(codigo, process.env.CODIGO_INVITACION);
}

/** Código de un solo uso para que el dueño real de la agencia tome el control. */
export function codigoDuenoValido(codigo: string) {
  return coincide(codigo, process.env.CODIGO_DUENO);
}

/** El código de dueño se puede usar una sola vez: queda registrado en la auditoría. */
export async function codigoDuenoYaUsado() {
  return (await prisma.auditLog.count({ where: { action: "dealership.owner_claimed" } })) > 0;
}

type Acceso =
  | { estado: "ok"; user: { id: string; name?: string | null; role: string }; dealership: NonNullable<Awaited<ReturnType<typeof getAgencia>>>; esDueno: boolean }
  | { estado: "sin-sesion" }
  | { estado: "falta-registro" }
  | { estado: "sin-acceso" };

/**
 * Resuelve el acceso leyendo el rol y la concesionaria desde la base (no del
 * token), así quitarle el acceso a alguien tiene efecto inmediato.
 */
async function resolverAcceso(): Promise<Acceso> {
  const session = await auth();
  if (!session?.user) return { estado: "sin-sesion" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });
  if (!user || (user.role !== "DEALER_OWNER" && user.role !== "DEALER_STAFF")) return { estado: "sin-acceso" };

  const [dealership, agencia] = await Promise.all([
    prisma.dealership.findFirst({ where: { OR: [{ ownerId: user.id }, { staff: { some: { id: user.id } } }] } }),
    getAgencia(),
  ]);

  if (!dealership) {
    // Solo el dueño de una instalación nueva (sin agencia todavía) completa el registro.
    return !agencia && user.role === "DEALER_OWNER" ? { estado: "falta-registro" } : { estado: "sin-acceso" };
  }
  if (agencia && dealership.id !== agencia.id) return { estado: "sin-acceso" };

  return { estado: "ok", user, dealership, esDueno: dealership.ownerId === user.id };
}

/** Para páginas del panel: redirige si no hay sesión, registro o acceso. */
export async function requireDealer() {
  const acceso = await resolverAcceso();
  if (acceso.estado === "sin-sesion") redirect("/login?callbackUrl=/dealer");
  if (acceso.estado === "falta-registro") redirect("/dealer/onboarding");
  if (acceso.estado === "sin-acceso") redirect("/sin-acceso");
  return { user: acceso.user, dealership: acceso.dealership, esDueno: acceso.esDueno };
}

/** Variante para Server Actions y Route Handlers: no redirige, devuelve null. */
export async function getDealerOrNull() {
  const acceso = await resolverAcceso();
  if (acceso.estado !== "ok") return null;
  return { user: acceso.user, dealership: acceso.dealership, esDueno: acceso.esDueno };
}
