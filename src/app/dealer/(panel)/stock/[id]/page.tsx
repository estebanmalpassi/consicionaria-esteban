import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileSignature, Sparkles } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { formatArs, formatKm } from "@/lib/utils";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/types/vehicle";
import { Button } from "@/components/ui/button";
import { BorrarVehiculo, CompartirFicha } from "@/components/dealer/acciones-vehiculo";
import { FormularioVehiculo } from "@/components/dealer/formulario-vehiculo";
import { GastosAuto } from "@/components/dealer/gastos-auto";
import { ReservaAuto } from "@/components/dealer/reserva-auto";
import { apartadosDe } from "@/lib/apartados";
import { GaleriaVehiculo } from "@/components/dealer/galeria-vehiculo";

export default async function FichaAutoPage({ params }: PageProps<"/dealer/stock/[id]">) {
  const { id } = await params;
  const { dealership, esDueno } = await requireDealer();
  const auto = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealership.id },
    include: {
      photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }] },
      sales: { where: { status: { not: "ANULADA" } }, select: { id: true, number: true }, take: 1 },
      expenses: { orderBy: { date: "asc" }, select: { id: true, category: true, description: true, amountArs: true } },
    },
  });
  if (!auto) notFound();

  const apartado = auto.status === "PAUSED" && !auto.sales[0] ? (await apartadosDe([auto.id])).get(auto.id) ?? null : null;
  const precio = Number(auto.priceArs);
  const costo = auto.purchasePriceArs ? Number(auto.purchasePriceArs) : null;
  const venta = auto.sales[0];
  const titulo = `${auto.brand} ${auto.model}${auto.version ? ` ${auto.version}` : ""}`;
  const ficha = [
    `🚗 *${titulo}* ${auto.year}`,
    `📍 ${formatKm(auto.mileageKm)} · ${FUEL_LABELS[auto.fuelType]} · ${TRANSMISSION_LABELS[auto.transmission]}`,
    auto.color ? `🎨 ${auto.color}` : null,
    `💲 ${formatArs(precio)}`,
    auto.description ? `\n${auto.description}` : null,
    `\n${dealership.tradeName}${dealership.phone ? ` · ${dealership.phone}` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6">
      <Link href="/dealer/stock" className="text-muted-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Stock
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GaleriaVehiculo vehicleId={auto.id} fotos={auto.photos.map((f) => ({ id: f.id, src: fotoUrl(f), isCover: f.isCover }))} />

        <div className="grid content-start gap-4">
          <div>
            <span className="rounded-md border bg-white px-2 py-0.5 font-mono text-sm font-semibold text-neutral-900">{auto.patente}</span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{titulo}</h1>
            <p className="text-muted-foreground">
              {auto.year} · {formatKm(auto.mileageKm)} · {FUEL_LABELS[auto.fuelType]} · {TRANSMISSION_LABELS[auto.transmission]}
            </p>
          </div>
          <div className="bg-card rounded-2xl border p-4">
            <p className="text-3xl font-bold tabular-nums">{formatArs(precio)}</p>
            <p className="text-muted-foreground mt-1 text-xs">Precio de venta. Los costos y la ganancia están más abajo.</p>
          </div>

          {venta ? (
            <Button asChild variant="trust" size="lg" className="h-12 text-base">
              <Link href={`/dealer/operaciones/${venta.id}`}>
                <FileSignature className="size-4" /> Ver operación N° {venta.number}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="h-12 text-base">
                <Link href={`/dealer/operaciones/nueva?auto=${auto.id}`}>
                  <FileSignature className="size-4" /> Vender este auto
                </Link>
              </Button>
              <ReservaAuto
                vehicleId={auto.id}
                apartado={
                  apartado && {
                    nombre: apartado.nombre,
                    telefono: apartado.telefono,
                    nota: apartado.nota,
                    desde: apartado.desde.toLocaleDateString("es-AR", { day: "numeric", month: "numeric", timeZone: "America/Argentina/Cordoba" }),
                  }
                }
              />
            </>
          )}
          <Button asChild variant="outline" size="lg" className="border-gold/60 h-12">
            <Link href={`/dealer/stock/${auto.id}/posteo`}>
              <Sparkles className="text-gold size-4" /> Crear posteo para Instagram
            </Link>
          </Button>
          <CompartirFicha texto={ficha} />
          {venta ? (
            <p className="text-muted-foreground text-xs">
              Para borrar este auto, primero anulá la operación N° {venta.number} (abajo de todo en la operación).
            </p>
          ) : (
            <BorrarVehiculo vehicleId={auto.id} />
          )}
        </div>
      </div>

      {/* Costos y ganancia: solo el dueño. */}
      {esDueno && (
        <GastosAuto
          vehicleId={auto.id}
          precioVenta={precio}
          precioCompra={costo}
          gastos={auto.expenses.map((g) => ({ ...g, amountArs: Number(g.amountArs) }))}
        />
      )}

      <details className="bg-card group rounded-2xl border p-4 sm:p-6">
        <summary className="cursor-pointer font-semibold">Editar datos del auto</summary>
        <div className="mt-6">
          <FormularioVehiculo
            vehicleId={auto.id}
            conCosto={esDueno}
            inicial={{
              patente: auto.patente,
              brand: auto.brand,
              model: auto.model,
              version: auto.version,
              year: auto.year,
              mileageKm: auto.mileageKm,
              bodyType: auto.bodyType,
              color: auto.color,
              engineNumber: auto.engineNumber,
              vin: auto.vin,
              fuelType: auto.fuelType,
              transmission: auto.transmission,
              priceArs: precio,
              purchasePriceArs: esDueno ? costo : null,
              description: auto.description,
            }}
          />
        </div>
      </details>
    </div>
  );
}
