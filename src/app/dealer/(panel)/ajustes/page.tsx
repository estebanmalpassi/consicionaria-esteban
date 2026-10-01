import { requireDealer } from "@/lib/dealer";
import { AFIP_CONDITION_LABELS } from "@/lib/validations/dealership";
import { FormDatosFiscales } from "@/components/dealer/form-datos-fiscales";

export default async function AjustesPage() {
  const { dealership: d } = await requireDealer();
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>

      <section className="bg-card grid gap-2 rounded-2xl border p-5">
        <h2 className="font-semibold">Datos que salen en los papeles</h2>
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Dato k="Nombre comercial" v={d.tradeName} />
          <Dato k="Razón social" v={d.legalName} />
          <Dato k="CUIT" v={d.cuit} />
          <Dato k="Condición IVA" v={AFIP_CONDITION_LABELS[d.afipConditionIva as keyof typeof AFIP_CONDITION_LABELS] ?? d.afipConditionIva ?? "—"} />
          <Dato k="Domicilio" v={[d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ")} />
          <Dato k="Teléfono" v={d.phone ?? "—"} />
        </dl>
        <p className="text-muted-foreground text-xs">Para cambiarlos, volvé a completar el registro de la concesionaria.</p>
      </section>

      <section className="bg-card grid gap-4 rounded-2xl border p-5">
        <div>
          <h2 className="font-semibold">Facturación</h2>
          <p className="text-muted-foreground text-sm">Se imprimen en el encabezado de la factura y en la numeración de los recibos.</p>
        </div>
        <FormDatosFiscales inicial={{ pointOfSale: d.pointOfSale, grossIncomeNumber: d.grossIncomeNumber, activityStartDate: d.activityStartDate }} />
      </section>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 sm:block sm:border-0">
      <dt className="text-muted-foreground text-xs">{k}</dt>
      <dd className="font-medium">{v || "—"}</dd>
    </div>
  );
}
