import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { AsistenteOperacion } from "@/components/dealer/asistente-operacion";

export default async function NuevaOperacionPage({ searchParams }: PageProps<"/dealer/operaciones/nueva">) {
  const { dealership } = await requireDealer();
  const { auto } = (await searchParams) as { auto?: string };

  const autos = await prisma.vehicle.findMany({
    where: { dealershipId: dealership.id, status: { not: "SOLD" } },
    orderBy: { createdAt: "desc" },
    include: { photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 } },
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground text-sm">Completá 4 pasos y la app arma el boleto, el recibo y los datos del 08.</p>
      </div>
      <AsistenteOperacion
        autoInicial={autos.some((a) => a.id === auto) ? auto : undefined}
        concesionaria={{
          tradeName: dealership.tradeName,
          legalName: dealership.legalName,
          cuit: dealership.cuit,
          ciudad: dealership.addressCity,
        }}
        autos={autos.map((a) => ({
          id: a.id,
          patente: a.patente,
          titulo: `${a.brand} ${a.model}${a.version ? ` ${a.version}` : ""}`,
          year: a.year,
          mileageKm: a.mileageKm,
          priceArs: Number(a.priceArs),
          color: a.color,
          engineNumber: a.engineNumber,
          vin: a.vin,
          portada: a.photos[0] ? fotoUrl(a.photos[0]) : null,
        }))}
      />
    </div>
  );
}
