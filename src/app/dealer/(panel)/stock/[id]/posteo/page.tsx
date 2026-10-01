import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { plantillasIngreso } from "@/lib/posteos";
import { prisma } from "@/lib/prisma";
import { GeneradorPosteo } from "@/components/dealer/generador-posteo";

export default async function PosteoAutoPage({ params }: PageProps<"/dealer/stock/[id]/posteo">) {
  const { id } = await params;
  const { dealership } = await requireDealer();
  const auto = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealership.id },
    include: { photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }] } },
  });
  if (!auto) notFound();

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link href={`/dealer/stock/${auto.id}`} className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> {auto.brand} {auto.model}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Posteo para Instagram</h1>
        <p className="text-muted-foreground text-sm">Con el diseño de la agencia. Elegí la foto, retocá el texto si querés y compartilo.</p>
      </div>
      <GeneradorPosteo
        nombreArchivo={`cartuccia-${auto.patente.toLowerCase()}`}
        fotos={auto.photos.map((f) => ({ id: f.id, src: fotoUrl(f) }))}
        plantillas={plantillasIngreso(auto, dealership)}
      />
    </div>
  );
}
