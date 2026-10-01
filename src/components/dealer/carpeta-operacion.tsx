"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";

import {
  agregarReciboAction,
  anularOperacionAction,
  registrarEntregaAction,
  toggleTramiteAction,
} from "@/lib/actions/operaciones";
import { FORMA_PAGO_LABELS, PASOS_TRAMITE } from "@/lib/sales/comprobantes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AvisoError, Campo, Entrada, EntradaPesos, Selector } from "@/components/dealer/campo";

const hoy = () => new Date().toISOString().slice(0, 10);

export function ChecklistTramites({ saleId, checklist }: { saleId: string; checklist: Record<string, boolean> }) {
  const router = useRouter();
  const [estado, setEstado] = React.useState(checklist);
  const [, startTransition] = React.useTransition();

  const toggle = (id: string) => {
    const nuevo = !estado[id];
    setEstado((e) => ({ ...e, [id]: nuevo })); // optimista: se tilda al instante
    startTransition(async () => {
      await toggleTramiteAction(saleId, id, nuevo);
      router.refresh();
    });
  };

  return (
    <ol className="grid gap-1">
      {PASOS_TRAMITE.map((p, i) => {
        const hecho = !!estado[p.id];
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => toggle(p.id)}
              className="hover:bg-accent/60 flex w-full items-start gap-3 rounded-xl p-2 text-left transition"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition",
                  hecho ? "border-trust bg-trust text-trust-foreground" : "text-muted-foreground"
                )}
              >
                {hecho ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-medium", hecho && "text-muted-foreground line-through")}>{p.titulo}</span>
                <span className="text-muted-foreground block text-xs">{p.detalle}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function NuevoRecibo({ saleId, saldo }: { saleId: string; saldo: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [monto, setMonto] = React.useState<number | null>(saldo || null);
  const [error, setError] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  if (!abierto) {
    return (
      <Button type="button" variant="outline" className="h-11" onClick={() => setAbierto(true)}>
        <Plus className="size-4" /> Registrar un pago y hacer recibo
      </Button>
    );
  }

  return (
    <form
      className="bg-muted/40 grid gap-3 rounded-xl p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setEnviando(true);
        setError(null);
        const res = await agregarReciboAction({
          saleId,
          amountArs: monto ?? 0,
          concept: String(fd.get("concept")),
          method: fd.get("method") as "CONTADO",
          date: String(fd.get("date")),
          notes: String(fd.get("notes") ?? ""),
        });
        setEnviando(false);
        if (!res.ok || !res.data) return setError(res.error ?? "No se pudo guardar.");
        setAbierto(false);
        router.refresh();
        window.open(`/dealer/operaciones/${saleId}/imprimir?doc=recibo&recibo=${res.data.id}`, "_blank");
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Monto" htmlFor="r-monto">
          <EntradaPesos id="r-monto" value={monto} onValueChange={setMonto} />
        </Campo>
        <Campo label="Fecha" htmlFor="r-fecha">
          <Entrada id="r-fecha" name="date" type="date" defaultValue={hoy()} />
        </Campo>
        <Campo label="Concepto" htmlFor="r-concepto">
          <Selector id="r-concepto" name="concept" defaultValue={saldo > 0 ? "Saldo de precio" : "Pago a cuenta"}>
            <option>Seña / reserva del vehículo</option>
            <option>Pago a cuenta</option>
            <option>Saldo de precio</option>
            <option>Pago total del vehículo</option>
            <option>Gastos de transferencia</option>
          </Selector>
        </Campo>
        <Campo label="Medio de pago" htmlFor="r-medio">
          <Selector id="r-medio" name="method" defaultValue="CONTADO">
            {Object.entries(FORMA_PAGO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Selector>
        </Campo>
      </div>
      <Campo label="Aclaración (opcional)" htmlFor="r-notas">
        <Entrada id="r-notas" name="notes" placeholder="Ej.: transferencia Banco Nación, comprobante 123456" />
      </Campo>
      <AvisoError>{error}</AvisoError>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={enviando || !monto}>
          {enviando && <Loader2 className="size-4 animate-spin" />} Guardar e imprimir recibo
        </Button>
      </div>
    </form>
  );
}

export function FormEntrega({ saleId, km }: { saleId: string; km: number }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setEnviando(true);
        const res = await registrarEntregaAction({
          saleId,
          deliveryDate: String(fd.get("deliveryDate")),
          deliveryKm: Number(fd.get("deliveryKm")),
        });
        setEnviando(false);
        if (!res.ok) return setError(res.error ?? "No se pudo guardar.");
        router.refresh();
        window.open(`/dealer/operaciones/${saleId}/imprimir?doc=entrega`, "_blank");
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Fecha de entrega" htmlFor="e-fecha">
          <Entrada id="e-fecha" name="deliveryDate" type="date" defaultValue={hoy()} />
        </Campo>
        <Campo label="Km al entregar" htmlFor="e-km">
          <Entrada id="e-km" name="deliveryKm" inputMode="numeric" defaultValue={km} />
        </Campo>
      </div>
      <AvisoError>{error}</AvisoError>
      <Button type="submit" variant="trust" disabled={enviando}>
        {enviando && <Loader2 className="size-4 animate-spin" />} Marcar como entregado e imprimir acta
      </Button>
    </form>
  );
}

export function AnularOperacion({ saleId }: { saleId: string }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-destructive"
      onClick={async () => {
        if (!confirm("¿Anular esta operación? El auto vuelve a quedar disponible en el stock.")) return;
        await anularOperacionAction(saleId);
        router.refresh();
      }}
    >
      Anular operación
    </Button>
  );
}
