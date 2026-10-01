import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Sparkles, PartyPopper, Printer, ReceiptText } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { DOCUMENTOS, ESTADO_VENTA_LABELS, numeroRecibo, progresoTramite } from "@/lib/sales/comprobantes";
import { fechaCorta, obtenerOperacion, totalesOperacion } from "@/lib/sales/operacion";
import { formatArs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnilloProgreso } from "@/components/dealer/anillo-progreso";
import {
  AnularOperacion,
  ChecklistTramites,
  FormEntrega,
  NuevoRecibo,
} from "@/components/dealer/carpeta-operacion";

export default async function CarpetaOperacionPage({ params, searchParams }: PageProps<"/dealer/operaciones/[id]">) {
  const { id } = await params;
  const { nueva } = (await searchParams) as { nueva?: string };
  const { dealership } = await requireDealer();
  const op = await obtenerOperacion(id, dealership.id);
  if (!op) notFound();

  const { precio, permuta, cobrado, saldo } = totalesOperacion(op);
  const checklist = (op.checklist ?? {}) as Record<string, boolean>;
  const prog = progresoTramite(checklist);
  const v = op.vehicle;
  const anulada = op.status === "ANULADA";
  const imprimir = (doc: string, extra = "") => `/dealer/operaciones/${op.id}/imprimir?doc=${doc}${extra}`;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6">
      <Link href="/dealer/operaciones" className="text-muted-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Operaciones
      </Link>

      {nueva && (
        <div className="bg-trust-muted text-trust flex items-center gap-3 rounded-2xl p-4">
          <PartyPopper className="size-6 shrink-0" />
          <div>
            <p className="font-semibold">¡Operación cargada! Los papeles ya están listos.</p>
            <p className="text-sm opacity-90">Imprimí el boleto para firmar. Cada pago que registres genera su recibo.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">
            Operación N° {op.number} · {fechaCorta(op.saleDate)} · {ESTADO_VENTA_LABELS[op.status]}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {v.brand} {v.model} <span className="text-muted-foreground font-mono text-lg">{v.patente}</span>
          </h1>
          <p className="text-muted-foreground">
            Vende {op.seller?.fullName ?? dealership.tradeName} → compra <b className="text-foreground">{op.buyer.fullName}</b>
          </p>
        </div>
        {!anulada && <AnilloProgreso porcentaje={prog.porcentaje} tamano={64} />}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra k="Precio" v={formatArs(precio)} />
        <Cifra k="Cobrado" v={formatArs(cobrado)} />
        {permuta > 0 && <Cifra k="Permuta" v={formatArs(permuta)} />}
        <Cifra k="Saldo" v={formatArs(saldo)} destacado={saldo > 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-6">
          {/* Papeles */}
          <Seccion titulo="Papeles listos para imprimir" accion={
            <Button asChild size="sm" variant="outline">
              <Link href={imprimir("todo")} target="_blank">
                <Printer className="size-4" /> Imprimir todo
              </Link>
            </Button>
          }>
            <div className="grid gap-2 sm:grid-cols-2">
              {DOCUMENTOS.filter((d) => d.id !== "recibo").map((d) => (
                <Link
                  key={d.id}
                  href={imprimir(d.id)}
                  target="_blank"
                  className="hover:border-primary hover:bg-primary/5 flex items-start gap-3 rounded-xl border p-3 transition"
                >
                  <FileText className="text-primary mt-0.5 size-5 shrink-0" />
                  <span>
                    <span className="block text-sm font-medium">
                      {d.titulo}
                    </span>
                    <span className="text-muted-foreground block text-xs">{d.descripcion}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Seccion>

          {/* Pagos y recibos */}
          <Seccion titulo="Pagos y recibos">
            {op.receipts.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {op.receipts.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 p-3 text-sm">
                    <ReceiptText className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.concept}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {numeroRecibo(r.number)} · {fechaCorta(r.date)}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatArs(Number(r.amountArs))}</span>
                    <Button asChild size="icon" variant="ghost" aria-label="Imprimir recibo">
                      <Link href={imprimir("recibo", `&recibo=${r.id}`)} target="_blank">
                        <Printer className="size-4" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {!anulada && <NuevoRecibo saleId={op.id} saldo={saldo} />}
          </Seccion>

          {/* Entrega */}
          {!anulada && (
            <Seccion titulo="Entrega del auto">
              {op.deliveryDate ? (
                <div className="grid gap-3">
                  <p className="text-sm">
                    Entregado el <b>{fechaCorta(op.deliveryDate)}</b> con <b>{op.deliveryKm?.toLocaleString("es-AR")} km</b>.{" "}
                    <Link href={imprimir("entrega")} target="_blank" className="text-primary hover:underline">
                      Imprimir acta
                    </Link>
                  </p>
                  <Button asChild variant="outline" className="border-gold/60 h-11 w-fit">
                    <Link href={`/dealer/operaciones/${op.id}/posteo`}>
                      <Sparkles className="text-gold size-4" /> Crear posteo de &quot;Nueva Entrega&quot;
                    </Link>
                  </Button>
                </div>
              ) : (
                <FormEntrega saleId={op.id} km={v.mileageKm} />
              )}
            </Seccion>
          )}
        </div>

        {/* Trámites */}
        <div className="grid min-w-0 grid-cols-1 content-start gap-6">
          <Seccion titulo={`Trámites · ${prog.hechos} de ${prog.total}`}>
            <ChecklistTramites key={JSON.stringify(checklist)} saleId={op.id} checklist={checklist} />
          </Seccion>
          <div className="text-muted-foreground grid gap-1 text-xs">
            <p>
              Comprador: {op.buyer.docType} {op.buyer.docNumber}
              {op.buyer.phone ? ` · ${op.buyer.phone}` : ""}
            </p>
            {op.notes && <p>Cláusulas: {op.notes}</p>}
          </div>
          {!anulada && <AnularOperacion saleId={op.id} />}
        </div>
      </div>
    </div>
  );
}

function Seccion({ titulo, accion, children }: { titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card grid min-w-0 grid-cols-1 gap-3 rounded-2xl border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Cifra({ k, v, destacado }: { k: string; v: string; destacado?: boolean }) {
  return (
    <div className={destacado ? "bg-warning/15 rounded-2xl p-4" : "bg-card rounded-2xl border p-4"}>
      <p className="text-muted-foreground text-xs">{k}</p>
      <p className="truncate text-lg font-bold tabular-nums">{v}</p>
    </div>
  );
}
