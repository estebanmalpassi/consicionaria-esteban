"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { guardarVehiculoAction } from "@/lib/actions/vehiculos";
import { subirFoto } from "@/lib/comprimir-imagen";
import type { VehiculoValues } from "@/lib/validations/operacion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AreaTexto, AvisoError, Campo, Entrada, EntradaPesos } from "@/components/dealer/campo";
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
          <div
            className={cn(
              "focus-within:ring-ring/50 overflow-hidden rounded-lg border-2 border-neutral-900 bg-white focus-within:ring-[3px]",
              inv("patente") && "border-destructive"
            )}
          >
            <div className="bg-[#1f4fa3] py-0.5 text-center text-[8px] font-bold tracking-[0.18em] text-white">REPÚBLICA ARGENTINA</div>
            <input
              id="patente"
              name="patente"
              required
              defaultValue={d("patente")}
              placeholder="AB123CD"
              autoCapitalize="characters"
              autoComplete="off"
              className="h-10 w-full bg-white text-center font-mono text-xl font-bold tracking-[0.15em] text-neutral-900 uppercase outline-none placeholder:text-neutral-300"
              aria-invalid={inv("patente")}
            />
          </div>
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
        <GrupoOpciones
          className="col-span-2 sm:col-span-4"
          etiqueta="Tipo"
          name="bodyType"
          defaultValue={d("bodyType") || "Sedán"}
          opciones={CARROCERIAS.map((c) => ({ valor: c, texto: c }))}
        />
        <GrupoOpciones
          className="col-span-2"
          etiqueta="Combustible"
          name="fuelType"
          defaultValue={d("fuelType") || "NAFTA"}
          opciones={[
            { valor: "NAFTA", texto: "Nafta" },
            { valor: "DIESEL", texto: "Diésel" },
            { valor: "GNC", texto: "Nafta / GNC" },
            { valor: "HIBRIDO", texto: "Híbrido" },
            { valor: "ELECTRICO", texto: "Eléctrico" },
          ]}
        />
        <GrupoOpciones
          className="col-span-2"
          etiqueta="Caja"
          name="transmission"
          defaultValue={d("transmission") || "MANUAL"}
          opciones={[
            { valor: "MANUAL", texto: "Manual" },
            { valor: "AUTOMATICA", texto: "Automática" },
          ]}
        />
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

/** Opciones de un toque (en vez de una lista desplegable). Guarda el valor en un input oculto. */
function GrupoOpciones({
  etiqueta,
  name,
  defaultValue,
  opciones,
  className,
}: {
  etiqueta: string;
  name: string;
  defaultValue: string;
  opciones: { valor: string; texto: string }[];
  className?: string;
}) {
  const [valor, setValor] = React.useState(defaultValue);
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span id={id} className="text-sm font-medium">
        {etiqueta}
      </span>
      <input type="hidden" name={name} value={valor} />
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={valor === o.valor}
            onClick={() => setValor(o.valor)}
            className={cn(
              "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
              valor === o.valor ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
            )}
          >
            {o.texto}
          </button>
        ))}
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

  const alta = !vehicleId;
  const [paso, setPaso] = React.useState<0 | 1>(alta ? 0 : 1);
  const irA = (p: 0 | 1) => {
    setPaso(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {alta && (
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Pasos para cargar el auto">
          {(["Fotos", "Datos"] as const).map((nombre, i) => (
            <button
              key={nombre}
              type="button"
              role="tab"
              aria-selected={paso === i}
              onClick={() => irA(i as 0 | 1)}
              className={cn("grid gap-1.5 text-left text-sm font-semibold", paso === i ? "text-foreground" : "text-muted-foreground")}
            >
              <span className={cn("h-1 rounded-full", paso >= i ? "bg-gold" : "bg-muted")} />
              {i + 1} · {nombre}
              {i === 0 && fotos.length > 0 && <span className="text-muted-foreground text-xs font-normal">{fotos.length} cargadas</span>}
            </button>
          ))}
        </div>
      )}

      {alta && (
        <section className="grid gap-3" hidden={paso !== 0}>
          <SelectorFotos fotos={fotos} onChange={setFotos} />
          <p className="text-muted-foreground text-xs">La primera foto queda de portada. Después podés sumar o cambiar fotos desde la ficha del auto.</p>
        </section>
      )}

      <section className="grid gap-3" hidden={paso !== 1}>
        {!alta && <h2 className="font-semibold">Datos del auto</h2>}
        <CamposVehiculo inicial={inicial} errorEn={error?.field} />
        <Campo label="Descripción / observaciones" htmlFor="description">
          <AreaTexto id="description" name="description" defaultValue={(inicial?.description as string) ?? ""} placeholder="Único dueño, service oficial, cubiertas nuevas…" />
        </Campo>
      </section>

      <AvisoError>{error?.msg}</AvisoError>

      {/* En el celular la barra queda arriba del botón "+" de la navegación, sin taparlo. */}
      <div className="bg-background/95 sticky bottom-16 z-10 -mx-4 flex gap-2 border-t px-4 pt-3 pb-9 backdrop-blur md:bottom-0 md:pb-3">
        {alta && paso === 1 && (
          <Button type="button" variant="outline" size="lg" className="h-12" onClick={() => irA(0)}>
            Atrás
          </Button>
        )}
        {alta && paso === 0 ? (
          <Button type="button" size="lg" className="h-12 flex-1 text-base" onClick={() => irA(1)}>
            {fotos.length ? "Siguiente: datos del auto" : "Seguir sin fotos"}
          </Button>
        ) : (
          <Button type="submit" size="lg" className="h-12 flex-1 text-base" disabled={!!estado}>
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
        )}
      </div>
    </form>
  );
}
