import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import { ESTADO_VENTA_LABELS, progresoTramite } from "@/lib/sales/comprobantes";
import { fechaCorta } from "@/lib/sales/operacion";
import { cn, formatArs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnilloProgreso } from "@/components/dealer/anillo-progreso";

const COLOR_ESTADO = {
  RESERVADA: "bg-warning/20 text-warning-foreground",
  VENDIDA: "bg-primary/10 text-primary",
  ENTREGADA: "bg-trust-muted text-trust",
  ANULADA: "bg-muted text-muted-foreground line-through",
} as const;

export default async function OperacionesPage({ searchParams }: PageProps<"/dealer/operaciones">) {
  const { dealership } = await requireDealer();
  const { q } = (await searchParams) as { q?: string };

  const operaciones = await prisma.sale.findMany({
    where: {
      dealershipId: dealership.id,
      ...(q && {
        OR: [
          { buyer: { fullName: { contains: q, mode: "insensitive" } } },
          { buyer: { docNumber: { contains: q.replace(/\D/g, "") || q } } },
          { vehicle: { patente: { contains: q.toUpperCase().replace(/\s/g, "") } } },
        ],
      }),
    },
    orderBy: { saleDate: "desc" },
    include: {
      buyer: { select: { fullName: true } },
      vehicle: { select: { brand: true, model: true, patente: true } },
    },
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Operaciones</h1>
        <Button asChild>
          <Link href="/dealer/operaciones/nueva">
            <Plus className="size-4" /> Nueva venta
          </Link>
        </Button>
      </div>
      <form>
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por comprador, DNI o patente…"
          className="border-input bg-background h-11 w-full rounded-xl border px-4 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
        />
      </form>

      {operaciones.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <FileSignature className="size-8" />
          <p>Todavía no hay operaciones.</p>
          <Button asChild variant="outline">
            <Link href="/dealer/operaciones/nueva">Cargar la primera venta</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card divide-y overflow-hidden rounded-2xl border">
          {operaciones.map((op) => (
            <Link key={op.id} href={`/dealer/operaciones/${op.id}`} className="hover:bg-accent/50 flex items-center gap-3 p-3 transition sm:p-4">
              <span className="text-muted-foreground w-10 shrink-0 text-center font-mono text-xs">#{op.number}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {op.vehicle.brand} {op.vehicle.model} <span className="text-muted-foreground font-mono text-xs">{op.vehicle.patente}</span>
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {op.buyer.fullName} · {fechaCorta(op.saleDate)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-semibold tabular-nums">{formatArs(Number(op.priceArs))}</p>
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", COLOR_ESTADO[op.status])}>{ESTADO_VENTA_LABELS[op.status]}</span>
              </div>
              {op.status !== "ANULADA" && <AnilloProgreso porcentaje={progresoTramite(op.checklist).porcentaje} />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
