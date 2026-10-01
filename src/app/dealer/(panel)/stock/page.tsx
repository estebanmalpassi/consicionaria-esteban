import Link from "next/link";
import { Camera, Car, Plus } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { cn, formatArs, formatKm } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FILTROS = [
  { id: "disponibles", label: "Disponibles" },
  { id: "vendidos", label: "Vendidos" },
  { id: "sin-fotos", label: "Sin fotos" },
  { id: "todos", label: "Todos" },
] as const;

export default async function StockPage({ searchParams }: PageProps<"/dealer/stock">) {
  const { dealership } = await requireDealer();
  const { filtro = "disponibles", q } = (await searchParams) as { filtro?: string; q?: string };

  const where = {
    dealershipId: dealership.id,
    ...(filtro === "disponibles" && { status: { not: "SOLD" as const } }),
    ...(filtro === "vendidos" && { status: "SOLD" as const }),
    ...(filtro === "sin-fotos" && { status: { not: "SOLD" as const }, photos: { none: {} } }),
    ...(q && {
      OR: [
        { patente: { contains: q.toUpperCase().replace(/\s/g, "") } },
        { brand: { contains: q, mode: "insensitive" as const } },
        { model: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const autos = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 }, _count: { select: { photos: true } } },
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
        <Button asChild>
          <Link href="/dealer/stock/nuevo">
            <Plus className="size-4" /> Cargar auto
          </Link>
        </Button>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="filtro" value={filtro} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por patente, marca o modelo…"
          className="border-input bg-background h-11 flex-1 rounded-xl border px-4 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
        />
        <div className="flex gap-1 overflow-x-auto">
          {FILTROS.map((f) => (
            <Link
              key={f.id}
              href={`/dealer/stock?filtro=${f.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap",
                filtro === f.id ? "bg-foreground text-background border-foreground" : "hover:bg-accent"
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {autos.map((a) => {
            const foto = a.photos[0];
            return (
              <Link key={a.id} href={`/dealer/stock/${a.id}`} className="group bg-card overflow-hidden rounded-2xl border transition hover:shadow-md">
                <div className="bg-muted relative aspect-[4/3]">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoUrl(foto)} alt="" className="size-full object-cover transition group-hover:scale-[1.02]" />
                  ) : (
                    <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1 text-xs">
                      <Camera className="size-5" /> Sin fotos
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-900 shadow">
                    {a.patente}
                  </span>
                  {a.status === "SOLD" && (
                    <span className="bg-trust text-trust-foreground absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold">Vendido</span>
                  )}
                  {a._count.photos > 1 && (
                    <span className="absolute right-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] text-white">{a._count.photos} fotos</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate font-medium">
                    {a.brand} {a.model}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {a.year} · {formatKm(a.mileageKm)}
                  </p>
                  <p className="mt-1 font-semibold tabular-nums">{formatArs(Number(a.priceArs))}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
