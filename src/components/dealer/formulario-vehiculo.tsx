"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { guardarVehiculoAction } from "@/lib/actions/vehiculos";
import { subirFoto } from "@/lib/comprimir-imagen";
import type { VehiculoValues } from "@/lib/validations/operacion";
import { Button } from "@/components/ui/button";
import { AreaTexto, AvisoError, Campo, Entrada, EntradaPesos, Selector } from "@/components/dealer/campo";
import { SelectorFotos, type FotoPendiente } from "@/components/dealer/selector-fotos";

export type VehiculoInicial = Partial<Record<keyof VehiculoValues, string | number | null>>;

const CARROCERIAS = ["Sedán", "Hatchback", "SUV", "Pick-up", "Utilitario", "Rural / Familiar", "Coupé", "Moto"];

/** Campos del auto (sin <form>), reutilizados en el alta y en el wizard de operación. */
export function CamposVehiculo({
  inicial = {},
  errorEn,
  conPrecioCompra = true,
}: {
  inicial?: VehiculoInicial;
  errorEn?: string;
  conPrecioCompra?: boolean;
}) {
  const d = (k: keyof VehiculoValues) => (inicial[k] ?? "") as string;
  const inv = (k: string) => (errorEn === k ? true : undefined);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Campo label="Patente / dominio" htmlFor="patente" className="col-span-2 sm:col-span-1">
          <Entrada
            id="patente"
            name="patente"
            required
            defaultValue={d("patente")}
            placeholder="AB123CD"
            autoCapitalize="characters"
            className="font-mono tracking-widest uppercase"
            aria-invalid={inv("patente")}
          />
        </Campo>
        <Campo label="Marca" htmlFor="brand">
          <Entrada id="brand" name="brand" required defaultValue={d("brand")} placeholder="Toyota" aria-invalid={inv("brand")} />
        </Campo>
        <Campo label="Modelo" htmlFor="model">
          <Entrada id="model" name="model" required defaultValue={d("model")} placeholder="Corolla" aria-invalid={inv("model")} />
        </Campo>
        <Campo label="Versión" htmlFor="version" className="col-span-2 sm:col-span-1">
          <Entrada id="version" name="version" defaultValue={d("version")} placeholder="XEI 2.0 CVT" />
        </Campo>
        <Campo label="Año" htmlFor="year">
          <Entrada id="year" name="year" required inputMode="numeric" defaultValue={d("year")} placeholder="2020" aria-invalid={inv("year")} />
        </Campo>
        <Campo label="Kilómetros" htmlFor="mileageKm">
          <Entrada id="mileageKm" name="mileageKm" required inputMode="numeric" defaultValue={d("mileageKm")} placeholder="45000" aria-invalid={inv("mileageKm")} />
        </Campo>
        <Campo label="Color" htmlFor="color">
          <Entrada id="color" name="color" defaultValue={d("color")} placeholder="Gris plata" />
        </Campo>
        <Campo label="Tipo" htmlFor="bodyType">
          <Selector id="bodyType" name="bodyType" defaultValue={d("bodyType") || "Sedán"}>
            {CARROCERIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Selector>
        </Campo>
        <Campo label="Combustible" htmlFor="fuelType">
          <Selector id="fuelType" name="fuelType" defaultValue={d("fuelType") || "NAFTA"}>
            <option value="NAFTA">Nafta</option>
            <option value="DIESEL">Diésel</option>
            <option value="GNC">Nafta / GNC</option>
            <option value="HIBRIDO">Híbrido</option>
            <option value="ELECTRICO">Eléctrico</option>
          </Selector>
        </Campo>
        <Campo label="Caja" htmlFor="transmission">
          <Selector id="transmission" name="transmission" defaultValue={d("transmission") || "MANUAL"}>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATICA">Automática</option>
          </Selector>
        </Campo>
        <Campo label="N° de motor" htmlFor="engineNumber" hint="Figura en la cédula verde.">
          <Entrada id="engineNumber" name="engineNumber" defaultValue={d("engineNumber")} className="font-mono uppercase" />
        </Campo>
        <Campo label="N° de chasis" htmlFor="vin" hint="Figura en la cédula verde.">
          <Entrada id="vin" name="vin" defaultValue={d("vin")} className="font-mono uppercase" />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Precio de venta" htmlFor="priceArs">
          <EntradaPesos id="priceArs" name="priceArs" required defaultValue={inicial.priceArs} aria-invalid={inv("priceArs")} />
        </Campo>
        {conPrecioCompra && (
          <Campo label="Costo (uso interno)" htmlFor="purchasePriceArs" hint="No se imprime. Sirve para ver tu margen.">
            <EntradaPesos id="purchasePriceArs" name="purchasePriceArs" defaultValue={inicial.purchasePriceArs} />
          </Campo>
        )}
      </div>
    </div>
  );
}

export function formDataAVehiculo(fd: FormData): VehiculoValues {
  const o = Object.fromEntries(fd.entries()) as Record<string, string>;
  return {
    patente: o.patente,
    brand: o.brand,
    model: o.model,
    version: o.version,
    year: o.year,
    mileageKm: o.mileageKm,
    bodyType: o.bodyType,
    color: o.color,
    engineNumber: o.engineNumber,
    vin: o.vin,
    fuelType: o.fuelType as VehiculoValues["fuelType"],
    transmission: o.transmission as VehiculoValues["transmission"],
    priceArs: o.priceArs,
    purchasePriceArs: o.purchasePriceArs || undefined,
    description: o.description,
  };
}

/** Alta / edición de un auto del stock, con fotos. */
export function FormularioVehiculo({ vehicleId, inicial }: { vehicleId?: string; inicial?: VehiculoInicial }) {
  const router = useRouter();
  const [fotos, setFotos] = React.useState<FotoPendiente[]>([]);
  const [estado, setEstado] = React.useState<string | null>(null);
  const [error, setError] = React.useState<{ msg: string; field?: string } | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setEstado("Guardando datos…");
    const res = await guardarVehiculoAction(formDataAVehiculo(new FormData(e.currentTarget)), vehicleId);
    if (!res.ok || !res.data) {
      setEstado(null);
      setError({ msg: res.error ?? "No se pudo guardar.", field: res.field });
      return;
    }
    const id = res.data.id;
    for (let i = 0; i < fotos.length; i++) {
      setEstado(`Subiendo fotos ${i + 1} de ${fotos.length}…`);
      try {
        await subirFoto(id, fotos[i].file, fotos[i].label);
      } catch (err) {
        setError({ msg: `Se guardó el auto pero falló una foto: ${(err as Error).message}` });
      }
    }
    router.push(`/dealer/stock/${id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      {!vehicleId && (
        <section className="grid gap-3">
          <h2 className="font-semibold">1. Fotos</h2>
          <SelectorFotos fotos={fotos} onChange={setFotos} />
        </section>
      )}
      <section className="grid gap-3">
        <h2 className="font-semibold">{vehicleId ? "Datos del auto" : "2. Datos del auto"}</h2>
        <CamposVehiculo inicial={inicial} errorEn={error?.field} />
        <Campo label="Descripción / observaciones" htmlFor="description">
          <AreaTexto id="description" name="description" defaultValue={(inicial?.description as string) ?? ""} placeholder="Único dueño, service oficial, cubiertas nuevas…" />
        </Campo>
      </section>

      <AvisoError>{error?.msg}</AvisoError>

      <div className="bg-background/90 sticky bottom-16 z-10 -mx-4 border-t px-4 py-3 backdrop-blur md:bottom-0">
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!!estado}>
          {estado ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {estado}
            </>
          ) : vehicleId ? (
            "Guardar cambios"
          ) : (
            "Guardar auto en el stock"
          )}
        </Button>
      </div>
    </form>
  );
}
