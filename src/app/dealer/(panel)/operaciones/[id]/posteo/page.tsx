import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { plantillasEntrega } from "@/lib/posteos";
import { prisma } from "@/lib/prisma";
import { GeneradorPosteo } from "@/components/dealer/generador-posteo";

export default async function PosteoEntregaPage({ params }: PageProps<"/dealer/operaciones/[id]/posteo">) {
  const { id } = await params;
  const { dealership } = await requireDealer();
  const op = await prisma.sale.findFirst({
    where: { id, dealershipId: dealership.id },
    include: {
      buyer: { select: { fullName: true, city: true } },
      vehicle: { include: { photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }] } } },
    },
  });
  if (!op) notFound();

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link href={`/dealer/operaciones/${op.id}`} className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Operación N° {op.number}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Posteo de entrega</h1>
        <p className="text-muted-foreground text-sm">
          Tocá &quot;Otra foto&quot; para usar la foto del cliente con su auto, sacada en el momento.
        </p>
      </div>
      <GeneradorPosteo
        nombreArchivo={`cartuccia-entrega-${op.number}`}
        fotos={op.vehicle.photos.map((f) => ({ id: f.id, src: fotoUrl(f) }))}
        plantillas={plantillasEntrega(op.vehicle, op.buyer)}
      />
    </div>
  );
}
