import Link from "next/link";

import { requireDealer } from "@/lib/dealer";

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
          <Dato k="Domicilio" v={[d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ")} />
          <Dato k="Teléfono" v={d.phone ?? "—"} />
        </dl>
        <Link href="/dealer/onboarding" className="text-primary w-fit text-sm font-medium hover:underline">
          Editar datos de la concesionaria
        </Link>
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
