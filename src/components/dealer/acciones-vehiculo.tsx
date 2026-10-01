"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Share2, Trash2 } from "lucide-react";

import { borrarVehiculoAction } from "@/lib/actions/vehiculos";
import { Button } from "@/components/ui/button";

/** Comparte la ficha por WhatsApp (o el menú nativo del celular). */
export function CompartirFicha({ texto }: { texto: string }) {
  const compartir = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch {
        /* el usuario canceló: seguimos con WhatsApp web */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };
  return (
    <Button type="button" variant="outline" size="lg" className="h-12" onClick={compartir}>
      <Share2 className="size-4" /> Compartir ficha
    </Button>
  );
}

export function BorrarVehiculo({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <Button
        type="button"
        variant="ghost"
        className="text-destructive justify-start"
        onClick={async () => {
          if (!confirm("¿Borrar este auto y sus fotos? Si tuvo ventas anuladas, también se borran. No se puede deshacer.")) return;
          const res = await borrarVehiculoAction(vehicleId);
          if (!res.ok) return setError(res.error ?? "No se pudo borrar.");
          router.push("/dealer/stock");
          router.refresh();
        }}
      >
        <Trash2 className="size-4" /> Borrar auto
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
