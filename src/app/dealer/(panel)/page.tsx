import Link from "next/link";
import { ArrowRight, Camera, Car, FileSignature, Receipt, TrendingUp } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { ESTADO_VENTA_LABELS, progresoTramite } from "@/lib/sales/comprobantes";
import { formatArs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnilloProgreso } from "@/components/dealer/anillo-progreso";

export default async function PanelInicioPage() {
  const { user, dealership } = await requireDealer();
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [stock, ventasMes, abiertas, sinFotos] = await Promise.all([
    prisma.vehicle.aggregate({
      where: { dealershipId: dealership.id, status: { not: "SOLD" } },
      _count: true,
      _sum: { priceArs: true },
    }),
    prisma.sale.aggregate({
      where: { dealershipId: dealership.id, status: { not: "ANULADA" }, saleDate: { gte: inicioMes } },
      _count: true,
      _sum: { priceArs: true },
    }),
    prisma.sale.findMany({
      where: { dealershipId: dealership.id, status: { in: ["RESERVADA", "VENDIDA"] } },
      orderBy: { saleDate: "desc" },
      take: 6,
      include: {
        buyer: { select: { fullName: true } },
        vehicle: { select: { brand: true, model: true, patente: true, photos: { where: { isCover: true }, select: FOTO_SELECT, take: 1 } } },
      },
    }),
    prisma.vehicle.count({ where: { dealershipId: dealership.id, status: { not: "SOLD" }, photos: { none: {} } } }),
  ]);

  const nombre = user.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6">
      <div>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hola{nombre ? `, ${nombre}` : ""} 👋</h1>
      </div>

      {/* Acciones principales: lo que más se usa, grande y a un toque */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dealer/operaciones/nueva"
          className="group relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_top_right,#2a4360_0%,#132233_60%,#0b1520_100%)] p-5 text-white shadow-lg ring-1 ring-[#d4ad55]/30 transition hover:shadow-xl"
        >
          <FileSignature className="text-gold mb-6 size-8" />
          <p className="text-xl font-semibold">Nueva venta</p>
          <p className="text-sm text-white/80">Boleto y recibo listos en 4 pasos</p>
          <ArrowRight className="text-gold absolute right-5 bottom-5 size-5 transition group-hover:translate-x-1" />
        </Link>
        <Link
          href="/dealer/stock/nuevo"
          className="group bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-md"
        >
          <Camera className="text-primary mb-6 size-8" />
          <p className="text-xl font-semibold">Cargar un auto</p>
          <p className="text-muted-foreground text-sm">Sacale fotos con el celular y listo</p>
          <ArrowRight className="text-muted-foreground absolute right-5 bottom-5 size-5 transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icono={Car} titulo="Autos en stock" valor={String(stock._count)} />
        <Indicador icono={TrendingUp} titulo="Valor del stock" valor={formatArs(Number(stock._sum.priceArs ?? 0))} />
        <Indicador icono={Receipt} titulo="Ventas del mes" valor={String(ventasMes._count)} />
        <Indicador icono={TrendingUp} titulo="Vendido del mes" valor={formatArs(Number(ventasMes._sum.priceArs ?? 0))} />
      </div>

      {sinFotos > 0 && (
        <Link href="/dealer/stock?filtro=sin-fotos" className="bg-warning/15 flex items-center gap-3 rounded-xl p-3 text-sm">
          <Camera className="size-4 shrink-0" />
          <span>
            <b>{sinFotos}</b> {sinFotos === 1 ? "auto no tiene" : "autos no tienen"} fotos todavía.
          </span>
          <ArrowRight className="ml-auto size-4" />
        </Link>
      )}

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Operaciones en curso</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dealer/operaciones">Ver todas</Link>
          </Button>
        </div>
        {abiertas.length === 0 ? (
          <div className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
            No hay operaciones abiertas. Cuando cargues una venta, vas a ver acá cómo avanzan los papeles.
          </div>
        ) : (
          <div className="grid gap-2">
            {abiertas.map((op) => {
              const prog = progresoTramite(op.checklist);
              const foto = op.vehicle.photos[0];
              return (
                <Link key={op.id} href={`/dealer/operaciones/${op.id}`} className="bg-card hover:bg-accent/50 flex items-center gap-3 rounded-xl border p-3 transition">
                  <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fotoUrl(foto)} alt="" className="size-full object-cover" />
                    ) : (
                      <Car className="text-muted-foreground size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {op.vehicle.brand} {op.vehicle.model} <span className="text-muted-foreground font-mono text-xs">{op.vehicle.patente}</span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {op.buyer.fullName} · {ESTADO_VENTA_LABELS[op.status]}
                    </p>
                  </div>
                  <AnilloProgreso porcentaje={prog.porcentaje} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

function Indicador({ icono: Icono, titulo, valor }: { icono: React.ElementType; titulo: string; valor: string }) {
  return (
    <div className="bg-card rounded-2xl border p-4">
      <Icono className="text-muted-foreground mb-3 size-4" />
      <p className="truncate text-xl font-bold tabular-nums">{valor}</p>
      <p className="text-muted-foreground text-xs">{titulo}</p>
    </div>
  );
}
