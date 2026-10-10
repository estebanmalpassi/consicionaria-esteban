import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { FormularioVehiculo } from "@/components/dealer/formulario-vehiculo";

export default async function NuevoAutoPage() {
  const { esDueno } = await requireDealer();
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link href="/dealer/stock" className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Stock
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Cargar un auto</h1>
        <p className="text-muted-foreground text-sm">
          Desde el celular, tocá cada casillero y sacá la foto directo con la cámara. Se achican solas antes de subirse.
        </p>
      </div>
      <FormularioVehiculo conCosto={esDueno} />
    </div>
  );
}
