import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve la sesión y la concesionaria del usuario (dueño o empleado).
 * Para usar en páginas del panel: redirige si falta sesión o registro.
 */
export async function requireDealer() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer");
  if (session.user.role !== "DEALER_OWNER" && session.user.role !== "DEALER_STAFF") redirect("/");

  const dealership = await findDealershipForUser(session.user.id);
  if (!dealership) redirect("/dealer/onboarding");

  return { user: session.user, dealership };
}

/** Variante para Server Actions y Route Handlers: no redirige, devuelve null. */
export async function getDealerOrNull() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "DEALER_OWNER" && session.user.role !== "DEALER_STAFF") return null;
  const dealership = await findDealershipForUser(session.user.id);
  if (!dealership) return null;
  return { user: session.user, dealership };
}

function findDealershipForUser(userId: string) {
  return prisma.dealership.findFirst({
    where: { OR: [{ ownerId: userId }, { staff: { some: { id: userId } } }] },
  });
}
