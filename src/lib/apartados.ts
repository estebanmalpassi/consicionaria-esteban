import { prisma } from "@/lib/prisma";

export interface Apartado {
  nombre: string;
  telefono: string | null;
  nota: string | null;
  desde: Date;
}

/** Quién apartó cada auto (el último "apartado" registrado de cada uno). */
export async function apartadosDe(vehicleIds: string[]): Promise<Map<string, Apartado>> {
  const mapa = new Map<string, Apartado>();
  if (!vehicleIds.length) return mapa;
  const logs = await prisma.auditLog.findMany({
    where: { action: "vehicle.apartado", entityType: "Vehicle", entityId: { in: vehicleIds } },
    orderBy: { createdAt: "desc" },
    select: { entityId: true, metadata: true, createdAt: true },
  });
  for (const l of logs) {
    if (mapa.has(l.entityId)) continue;
    const m = (l.metadata ?? {}) as { nombre?: string; telefono?: string | null; nota?: string | null };
    mapa.set(l.entityId, { nombre: m.nombre ?? "—", telefono: m.telefono ?? null, nota: m.nota ?? null, desde: l.createdAt });
  }
  return mapa;
}
