import Link from "next/link";
import { Camera, Car, Plus, Search } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { apartadosDe } from "@/lib/apartados";
import { resultadoAuto } from "@/lib/gastos";
import { prisma } from "@/lib/prisma";
import { cn, formatArs, formatKm } from "@/lib/utils";
import { FUEL_LABELS } from "@/types/vehicle";
import { Button } from "@/components/ui/button";
import { Patente } from "@/components/dealer/patente";

const FILTROS = [
  { id: "disponibles", label: "Disponibles" },
  { id: "reservados", label: "Reservados" },
  { id: "vendidos", label: "Vendidos" },
  { id: "sin-fotos", label: "Sin fotos" },
  { id: "todos", label: "Todos" },
] as const;

/** A partir de estos días en stock, el auto se marca para revisar el precio o volver a publicarlo. */
const DIAS_ALERTA = 45;

type Estado = "disponible" | "reservado" | "vendido";

const ESTADOS: Record<Estado, { label: string; clase: string }> = {
  disponible: { label: "Disponible", clase: "bg-trust-muted text-trust" },
  reservado: { label: "Reservado", clase: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  vendido: { label: "Vendido", clase: "bg-muted text-muted-foreground" },
};

function diasDesde(fecha: Date, hoy: Date) {
  return Math.max(0, Math.floor((hoy.getTime() - fecha.getTime()) / 86_400_000));
}

export default async function StockPage({ searchParams }: PageProps<"/dealer/stock">) {
  const { dealership, esDueno } = await requireDealer();
  const { filtro = "disponibles", q } = (await searchParams) as { filtro?: string; q?: string };

  const where = {
    dealershipId: dealership.id,
    ...(filtro === "disponibles" && { status: { notIn: ["SOLD" as const, "PAUSED" as const] } }),
    ...(filtro === "reservados" && { OR: [{ sales: { some: { status: "RESERVADA" as const } } }, { status: "PAUSED" as const }] }),
    ...(filtro === "vendidos" && { sales: { some: { status: { in: ["VENDIDA" as const, "ENTREGADA" as const] } } } }),
    ...(filtro === "sin-fotos" && { status: { not: "SOLD" as const }, photos: { none: {} } }),
    ...(q && {
      AND: [{ OR: [
        { patente: { contains: q.toUpperCase().replace(/\s/g, "") } },
        { brand: { contains: q, mode: "insensitive" as const } },
        { model: { contains: q, mode: "insensitive" as const } },
      ] }],
    }),
  };

  const [autos, hoy] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 },
        _count: { select: { photos: true } },
        sales: {
          where: { status: { not: "ANULADA" } },
          select: { status: true, depositArs: true },
          take: 1,
        },
        expenses: { select: { amountArs: true } },
      },
    }),
    Promise.resolve(new Date()),
  ]);
  const apartados = await apartadosDe(autos.filter((a) => a.status === "PAUSED" && !a.sales.length).map((a) => a.id));

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
          <p className="text-muted-foreground text-sm">
            {autos.length} {autos.length === 1 ? "auto" : "autos"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dealer/stock/nuevo">
            <Plus className="size-4" /> Cargar auto
          </Link>
        </Button>
      </div>

      <form className="grid gap-3">
        <input type="hidden" name="filtro" value={filtro} />
        <label className="border-input bg-background focus-within:ring-ring/50 flex h-11 items-center gap-2 rounded-xl border px-3 focus-within:ring-[3px]">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <span className="sr-only">Buscar</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por marca, modelo o patente"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
          />
        </label>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {FILTROS.map((f) => (
            <Link
              key={f.id}
              href={`/dealer/stock?filtro=${f.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={filtro === f.id ? "page" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap",
                filtro === f.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </form>

      {autos.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <Car className="size-8" />
          <p>No hay autos para mostrar.</p>
          <Button asChild variant="outline">
            <Link href="/dealer/stock/nuevo">Cargar el primero</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {autos.map((a) => {
            const foto = a.photos[0];
            const venta = a.sales[0];
            const apartado = !venta ? apartados.get(a.id) : undefined;
            const estado: Estado = venta ? (venta.status === "RESERVADA" ? "reservado" : "vendido") : a.status === "PAUSED" ? "reservado" : "disponible";
            const dias = diasDesde(a.createdAt, hoy);
            const precio = Number(a.priceArs);
            const gastos = a.expenses.reduce((s, g) => s + Number(g.amountArs), 0);
            // El margen lo ve solo el dueño.
            const r = esDueno ? resultadoAuto(precio, a.purchasePriceArs ? Number(a.purchasePriceArs) : null, gastos) : null;
            return (
              <Link
                key={a.id}
                href={`/dealer/stock/${a.id}`}
                className="group bg-card grid min-h-32 grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl border transition hover:shadow-md sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <div className="relative bg-[radial-gradient(ellipse_at_center,#1f3348,#0d1824_75%)]">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoUrl(foto)} alt="" className="absolute inset-0 size-full object-cover transition group-hover:scale-[1.03]" />
                  ) : (
                    <div className="text-gold/80 absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold">
                      <Camera className="size-5" /> Falta la foto
                    </div>
                  )}
                  {a._count.photos > 1 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{a._count.photos} fotos</span>
                  )}
                </div>
                <div className="grid min-w-0 content-start gap-1 p-3">
                  <p className="truncate font-semibold">
                    {a.brand} {a.model}
                    {a.version ? ` ${a.version}` : ""}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {a.year} · {a.mileageKm > 0 ? formatKm(a.mileageKm) : "0 km"} · {FUEL_LABELS[a.fuelType]}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="font-bold whitespace-nowrap tabular-nums">{formatArs(precio)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase", ESTADOS[estado].clase)}>
                      {ESTADOS[estado].label}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <Patente valor={a.patente} />
                    {estado === "disponible" && (
                      <span className={cn(dias >= DIAS_ALERTA && "bg-warning/20 text-warning-foreground dark:text-warning rounded-md px-1.5 font-bold")}>
                        {dias === 0 ? "Cargado hoy" : `${dias} ${dias === 1 ? "día" : "días"}`}
                      </span>
                    )}
                    {estado === "reservado" && venta && Number(venta.depositArs) > 0 && <span>Seña {formatArs(Number(venta.depositArs))}</span>}
                    {estado === "reservado" && !venta && <span className="truncate">Apartado{apartado ? ` · ${apartado.nombre}` : ""}</span>}
                    {estado === "vendido" && venta?.status === "ENTREGADA" && <span>Entregado</span>}
                    {r && estado === "disponible" && (
                      <span
                        className={cn(
                          "font-bold",
                          r.nivel === "bueno" && "text-trust",
                          r.nivel === "bajo" && "text-warning-foreground dark:text-warning",
                          r.nivel === "perdida" && "text-destructive"
                        )}
                        title="Margen sobre el precio de venta, con los gastos descontados"
                      >
                        {r.ganancia >= 0 ? "+" : "−"}
                        {Math.abs(Math.round(r.porcentaje))} %
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
