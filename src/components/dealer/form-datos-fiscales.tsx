"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import { guardarDatosFiscalesAction } from "@/lib/actions/operaciones";
import { Button } from "@/components/ui/button";
import { AvisoError, Campo, Entrada } from "@/components/dealer/campo";

export function FormDatosFiscales({
  inicial,
}: {
  inicial: { pointOfSale: number; grossIncomeNumber: string | null; activityStartDate: string | null };
}) {
  const [estado, setEstado] = React.useState<"idle" | "guardando" | "ok">("idle");
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setEstado("guardando");
        setError(null);
        const res = await guardarDatosFiscalesAction({
          pointOfSale: Number(fd.get("pointOfSale")),
          grossIncomeNumber: String(fd.get("grossIncomeNumber") ?? ""),
          activityStartDate: String(fd.get("activityStartDate") ?? ""),
        });
        if (!res.ok) {
          setEstado("idle");
          return setError(res.error ?? "No se pudo guardar.");
        }
        setEstado("ok");
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo label="Punto de venta" htmlFor="pv" hint="El que usás en ARCA para facturar.">
          <Entrada id="pv" name="pointOfSale" inputMode="numeric" defaultValue={inicial.pointOfSale} />
        </Campo>
        <Campo label="Ingresos Brutos N°" htmlFor="iibb">
          <Entrada id="iibb" name="grossIncomeNumber" defaultValue={inicial.grossIncomeNumber ?? ""} />
        </Campo>
        <Campo label="Inicio de actividades" htmlFor="ini">
          <Entrada id="ini" name="activityStartDate" defaultValue={inicial.activityStartDate ?? ""} placeholder="01/03/2015" />
        </Campo>
      </div>
      <AvisoError>{error}</AvisoError>
      <Button type="submit" className="w-fit" disabled={estado === "guardando"}>
        {estado === "guardando" ? <Loader2 className="size-4 animate-spin" /> : estado === "ok" ? <Check className="size-4" /> : null}
        {estado === "ok" ? "Guardado" : "Guardar"}
      </Button>
    </form>
  );
}
