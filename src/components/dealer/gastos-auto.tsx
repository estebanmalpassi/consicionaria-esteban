"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Plus, X } from "lucide-react";

import { agregarGastoAction, borrarGastoAction } from "@/lib/actions/gastos";
import { CATEGORIAS_GASTO, resultadoAuto, type CategoriaGasto } from "@/lib/gastos";
import { cn, formatArs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AvisoError, Entrada, EntradaPesos } from "@/components/dealer/campo";

export interface GastoAuto {
  id: string;
  category: string;
  description: string | null;
  amountArs: number;
}

const INICIALES: Record<string, string> = {
  "Mecánica": "M",
  "Chapa y pintura": "CH",
  "Cubiertas": "C",
  "Lavado y detalle": "L",
  "Gestoría / VTV": "G",
  "Otro": "+",
};

/**
 * Costos del auto: lo que pagó la agencia más cada gasto que se le hizo
 * (chapa, cubiertas, service...) y la ganancia real contra el precio de venta.
 * Solo la ve el dueño: no sale en la web, ni en boletos ni en recibos, y los empleados no la ven.
 */
export function GastosAuto({
  vehicleId,
  precioVenta,
  precioCompra,
  gastos,
}: {
  vehicleId: string;
  precioVenta: number;
  precioCompra: number | null;
  gastos: GastoAuto[];
}) {
  const router = useRouter();
  const [categoria, setCategoria] = React.useState<CategoriaGasto>("Mecánica");
  const [monto, setMonto] = React.useState<number | null>(null);
  const [detalle, setDetalle] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [borrando, setBorrando] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const totalGastos = gastos.reduce((a, g) => a + g.amountArs, 0);
  const r = resultadoAuto(precioVenta, precioCompra, totalGastos);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto) return setError("Poné el monto del gasto.");
    setEnviando(true);
    setError(null);
    const res = await agregarGastoAction({ vehicleId, category: categoria, description: detalle, amount: monto });
    setEnviando(false);
    if (!res.ok) return setError(res.error ?? "No se pudo guardar el gasto.");
    setMonto(null);
    setDetalle("");
    router.refresh();
  };

  const borrar = async (id: string) => {
    setBorrando(id);
    const res = await borrarGastoAction(id);
    setBorrando(null);
    if (!res.ok) return setError(res.error ?? "No se pudo borrar el gasto.");
    router.refresh();
  };

  return (
    <section className="bg-card grid gap-4 rounded-2xl border p-4 sm:p-5" aria-labelledby="t-gastos">
      <div className="flex items-center justify-between gap-3">
        <h2 id="t-gastos" className="font-semibold">
          Costos y ganancia
        </h2>
        <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold">
          <Lock className="size-3" /> Solo el dueño
        </span>
      </div>

      <div className="grid gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Gastos del auto</p>
        {gastos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no cargaste gastos. Sumá chapa, cubiertas, service o lo que le hayas hecho.</p>
        ) : (
          <ul className="grid gap-2">
            {gastos.map((g) => (
              <li key={g.id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_2rem] items-center gap-2 text-sm">
                <span className="bg-gold/15 text-gold-foreground dark:text-gold flex size-8 items-center justify-center rounded-lg text-xs font-extrabold">
                  {INICIALES[g.category] ?? "+"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{g.category}</span>
                  {g.description && <span className="text-muted-foreground block truncate text-xs">{g.description}</span>}
                </span>
                <span className="font-semibold tabular-nums">{formatArs(g.amountArs)}</span>
                <button
                  type="button"
                  onClick={() => borrar(g.id)}
                  disabled={borrando === g.id}
                  aria-label={`Borrar gasto de ${g.category}`}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-8 items-center justify-center rounded-lg"
                >
                  {borrando === g.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={agregar} className="grid gap-3 border-t border-dashed pt-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de gasto">
          {CATEGORIAS_GASTO.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                categoria === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
          <Entrada aria-label="Detalle (opcional)" placeholder="Detalle (opcional), ej. paragolpe trasero" value={detalle} maxLength={120} onChange={(e) => setDetalle(e.target.value)} />
          <EntradaPesos aria-label="Monto del gasto" placeholder="Monto" value={monto} onValueChange={setMonto} />
          <Button type="submit" disabled={enviando} className="h-11">
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Sumar gasto
          </Button>
        </div>
        <AvisoError>{error}</AvisoError>
      </form>

      <div className="grid gap-2 border-t pt-4 text-sm tabular-nums">
        <Fila etiqueta="Precio de compra" valor={precioCompra === null ? "Sin cargar" : formatArs(precioCompra)} />
        <Fila etiqueta={`Gastos (${gastos.length})`} valor={formatArs(totalGastos)} />
        {r && <Fila etiqueta="Total invertido" valor={formatArs(r.invertido)} fuerte />}
        <Fila etiqueta="Precio de venta" valor={formatArs(precioVenta)} />
      </div>

      {r ? (
        <>
          <Barra compra={precioCompra ?? 0} gastos={totalGastos} ganancia={r.ganancia} />
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl p-3",
              r.nivel === "bueno" && "bg-trust-muted text-trust",
              r.nivel === "bajo" && "bg-warning/15 text-warning-foreground dark:text-warning",
              r.nivel === "perdida" && "bg-destructive/10 text-destructive"
            )}
          >
            <div>
              <p className="text-xs font-semibold">
                {r.nivel === "perdida" ? "Pérdida si se vende a ese precio" : "Ganancia si se vende a ese precio"}
                {r.nivel === "bajo" && " · margen bajo"}
              </p>
              <p className="text-2xl font-extrabold tabular-nums">
                {r.ganancia < 0 ? "− " : ""}
                {formatArs(Math.abs(r.ganancia))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">Margen</p>
              <p className="text-lg font-bold tabular-nums">{r.porcentaje.toFixed(1).replace(".", ",")} %</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Para ver la ganancia, cargá el precio de compra en &quot;Editar datos del auto&quot; (campo &quot;Costo&quot;).
        </p>
      )}
    </section>
  );
}

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", fuerte && "border-t pt-2 font-semibold")}>
      <span className={fuerte ? undefined : "text-muted-foreground"}>{etiqueta}</span>
      <span>{valor}</span>
    </div>
  );
}

/** Cómo se reparte el precio de venta: compra, gastos y ganancia. */
function Barra({ compra, gastos, ganancia }: { compra: number; gastos: number; ganancia: number }) {
  const total = Math.max(compra + gastos + Math.max(ganancia, 0), 1);
  const ancho = (n: number) => `${(Math.max(n, 0) / total) * 100}%`;
  return (
    <div className="grid gap-1.5">
      <div className="bg-muted flex h-3 overflow-hidden rounded-full" aria-hidden>
        <span className="bg-primary" style={{ width: ancho(compra) }} />
        <span className="bg-gold" style={{ width: ancho(gastos) }} />
        <span className="bg-trust" style={{ width: ancho(ganancia) }} />
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1">
          <i className="bg-primary size-2 rounded-sm" /> Compra
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="bg-gold size-2 rounded-sm" /> Gastos
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="bg-trust size-2 rounded-sm" /> Ganancia
        </span>
      </div>
    </div>
  );
}
