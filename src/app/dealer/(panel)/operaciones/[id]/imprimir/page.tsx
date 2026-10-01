import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireDealer } from "@/lib/dealer";
import { DOCUMENTOS } from "@/lib/sales/comprobantes";
import { obtenerOperacion } from "@/lib/sales/operacion";
import { cn } from "@/lib/utils";
import { BotonImprimir } from "@/components/dealer/boton-imprimir";
import { ActaEntrega, Boleto, DatosF08, Factura, Recibo } from "@/components/documentos/documentos";

export default async function ImprimirPage({ params, searchParams }: PageProps<"/dealer/operaciones/[id]/imprimir">) {
  const { id } = await params;
  const { doc = "boleto", recibo } = (await searchParams) as { doc?: string; recibo?: string };
  const { dealership } = await requireDealer();
  const op = await obtenerOperacion(id, dealership.id);
  if (!op) notFound();

  const reciboId = recibo ?? op.receipts.at(-1)?.id;
  const todos = doc === "todo";
  const pestañas = [...DOCUMENTOS.filter((d) => d.id !== "recibo" || op.receipts.length > 0), { id: "todo", titulo: "Todo junto" }];

  return (
    <div className="bg-muted/40 min-h-full print:bg-white">
      <div className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href={`/dealer/operaciones/${op.id}`} className="text-muted-foreground inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="size-4" /> Operación N° {op.number}
          </Link>
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {pestañas.map((d) => (
              <Link
                key={d.id}
                href={`/dealer/operaciones/${op.id}/imprimir?doc=${d.id}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap",
                  doc === d.id ? "bg-foreground text-background border-foreground" : "hover:bg-accent"
                )}
              >
                {d.titulo}
              </Link>
            ))}
          </div>
          <BotonImprimir />
        </div>
      </div>

      <div className="documentos mx-auto grid max-w-5xl gap-8 px-2 py-8 print:block print:p-0">
        {(todos || doc === "boleto") && <Boleto op={op} />}
        {(todos || doc === "boleto") && <Boleto op={op} />}
        {(todos || doc === "recibo") && reciboId && <Recibo op={op} reciboId={reciboId} />}
        {(todos || doc === "factura") && <Factura op={op} />}
        {(todos || doc === "f08") && <DatosF08 op={op} />}
        {(todos || doc === "entrega") && <ActaEntrega op={op} />}
      </div>
      <p className="text-muted-foreground mx-auto max-w-3xl px-4 pb-10 text-center text-xs print:hidden">
        El boleto sale por duplicado (una copia para cada parte). Los modelos de contrato son orientativos: revisalos con tu escribano o
        gestor antes de usarlos por primera vez.
      </p>
    </div>
  );
}
